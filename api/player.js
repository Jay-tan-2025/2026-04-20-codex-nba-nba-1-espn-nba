const { getPlayerDetails, searchPlayers } = require("./_lib/espn");

module.exports = async function handler(req, res) {
  try {
    const { id, q } = req.query;

    if (q) {
      const players = await searchPlayers(q);
      return res.status(200).json({ players });
    }

    if (!id) {
      return res.status(400).json({ error: "缺少球员 id。" });
    }

    const data = await getPlayerDetails(id);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
