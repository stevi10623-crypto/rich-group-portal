const { writeCopy } = require("./_lib");

// POST { kind: "facebook"|"instagram"|"tiktok"|"gbp"|"blog"|"review_reply", brief: string }
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { kind, brief } = req.body || {};
    if (!kind || !brief) return res.status(400).json({ error: "kind and brief are required" });
    const text = await writeCopy(kind, brief);
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
