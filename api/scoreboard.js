const { getTodayScoreboard } = require("./_lib/espn");

module.exports = async function handler(req, res) {
  try {
    const data = await getTodayScoreboard();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
