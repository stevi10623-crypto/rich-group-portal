const { generateHeadshot, OPTIONS } = require("./gemini");

// GET  -> { options }
// POST { dataUrl, background, attire, vibe } -> { ok, dataUrl, status, note }
module.exports = async (req, res) => {
  try {
    if (req.method === "GET") return res.status(200).json({ options: OPTIONS });
    if (req.method === "POST") {
      const b = req.body || {};
      if (!b.dataUrl) return res.status(400).json({ error: "no image" });
      const r = await generateHeadshot(b.dataUrl, {
        background: b.background, attire: b.attire, color: b.color,
        vibe: b.vibe, hair: b.hair, customBg: b.customBg,
      });
      return res.status(200).json({ ok: r.status === "generated", ...r });
    }
    res.status(405).json({ error: "unsupported method" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
