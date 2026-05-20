const { getGamePlayerStat } = require("./_lib/espn");
const {
  hasSupabaseConfig,
  insertPrediction,
  listPredictions,
  upsertVerifiedPrediction
} = require("./_lib/supabase");

function calculateAccuracy(prediction, actual) {
  const diff = Math.abs(prediction - actual);
  const rawScore = Math.max(0, 100 - diff * 12.5);
  return Math.round(rawScore);
}

function parseBody(req) {
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      if (!hasSupabaseConfig()) {
        return res.status(200).json({
          offline: true,
          rows: [],
          message: "Storage is not configured. The prediction page can still be viewed."
        });
      }

      try {
        const rows = await listPredictions();
        return res.status(200).json({ rows });
      } catch (error) {
        return res.status(200).json({
          offline: true,
          rows: [],
          message: "Storage is paused or unavailable. Reopen Supabase to save predictions."
        });
      }
    }

    if (req.method === "POST") {
      if (!hasSupabaseConfig()) {
        return res.status(200).json({
          offline: true,
          saved: [],
          message: "Storage is not configured, so this prediction was not saved."
        });
      }

      try {
        const body = parseBody(req);
        const saved = await insertPrediction({
          player_id: String(body.playerId),
          player_name: body.playerName,
          event_id: String(body.eventId),
          stat_type: body.statType,
          predicted_value: Number(body.predictedValue),
          note: body.note || ""
        });

        return res.status(200).json({ saved });
      } catch (error) {
        return res.status(200).json({
          offline: true,
          saved: [],
          message: "Storage is paused or unavailable, so this prediction was not saved."
        });
      }
    }

    if (req.method === "PATCH") {
      const body = parseBody(req);
      const actual = await getGamePlayerStat(body.eventId, body.playerId);

      if (!actual) {
        return res.status(404).json({
          error: "No player box-score row was found for this event."
        });
      }

      const actualValue = Number(actual.stats[body.statType] || 0);
      const accuracyScore = calculateAccuracy(Number(body.predictedValue), actualValue);
      let updated = [];

      if (hasSupabaseConfig() && body.id) {
        try {
          updated = await upsertVerifiedPrediction({
            id: body.id,
            player_id: String(body.playerId),
            player_name: body.playerName,
            event_id: String(body.eventId),
            stat_type: body.statType,
            predicted_value: Number(body.predictedValue),
            actual_value: actualValue,
            accuracy_score: accuracyScore,
            verified_at: new Date().toISOString(),
            note: body.note || ""
          });
        } catch (error) {
          updated = [];
        }
      }

      return res.status(200).json({
        actual,
        accuracyScore,
        updated
      });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
