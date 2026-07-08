const { submitImage, checkImage, cancelImage } = require("./_lib");

// POST { brief, aspect, engine } -> { promptId }
// GET  ?promptId=&engine=        -> { status, image?, error? }
// DELETE ?engine=                -> { cancelled: true }
module.exports = async (req, res) => {
  try {
    if (req.method === "POST") {
      const { brief, aspect, engine } = req.body || {};
      const promptId = await submitImage(brief || "", aspect || "portrait", engine || "draft");
      return res.status(200).json({ promptId });
    }
    if (req.method === "GET") {
      const { promptId, engine } = req.query || {};
      if (!promptId) return res.status(400).json({ error: "missing promptId" });
      return res.status(200).json(await checkImage(promptId, engine || "draft"));
    }
    if (req.method === "DELETE") {
      await cancelImage((req.query || {}).engine || "draft");
      return res.status(200).json({ cancelled: true });
    }
    res.status(405).json({ error: "unsupported method" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
