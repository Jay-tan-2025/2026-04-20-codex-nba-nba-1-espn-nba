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

module.exports = async function handler(req, res) {
  try {
    if (!hasSupabaseConfig()) {
      return res.status(200).json({
        offline: true,
        message: "你还没配置 Supabase，所以这里只能演示接口结构。"
      });
    }

    if (req.method === "GET") {
      const rows = await listPredictions();
      return res.status(200).json({ rows });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const saved = await insertPrediction({
        player_id: String(body.playerId),
        player_name: body.playerName,
        event_id: String(body.eventId),
        stat_type: body.statType,
        predicted_value: Number(body.predictedValue),
        note: body.note || ""
      });

      return res.status(200).json({ saved });
    }

    if (req.method === "PATCH") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const actual = await getGamePlayerStat(body.eventId, body.playerId);

      if (!actual) {
        return res.status(404).json({ error: "这场比赛里没有找到这个球员的数据。" });
      }

      const actualValue = Number(actual.stats[body.statType] || 0);
      const accuracyScore = calculateAccuracy(Number(body.predictedValue), actualValue);

      const updated = await upsertVerifiedPrediction({
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

      return res.status(200).json({
        actual,
        accuracyScore,
        updated
      });
    }

    return res.status(405).json({ error: "不支持的请求方法。" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
