const { generateHeadshot, editHeadshot, OPTIONS } = require("./gemini");

// GET  -> { options }
// POST { action:"edit", dataUrl, instruction } -> refine an existing headshot
// POST { dataUrl, background, attire, color, vibe, hair } -> generate
module.exports = async (req, res) => {
  try {
    if (req.method === "GET") return res.status(200).json({ options: OPTIONS });
    if (req.method === "POST" && (req.body || {}).action === "edit") {
      const b = req.body;
      const r = await editHeadshot(b.dataUrl, b.instruction);
      return res.status(200).json({ ok: r.status === "generated", ...r });
    }
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
