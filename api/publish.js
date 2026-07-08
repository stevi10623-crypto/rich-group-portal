const { publish } = require("./_lib");

// POST { caption, platforms: ["facebook","instagram"] } -> { staged, note }
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { caption, platforms } = req.body || {};
    if (!caption) return res.status(400).json({ error: "caption required" });
    res.status(200).json(await publish({ caption, platforms: platforms || ["facebook"] }));
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
