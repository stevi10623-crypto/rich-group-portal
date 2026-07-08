// Image gallery — headshots, post images, and uploaded listing photos.
// Images are written to data/gallery/<id>.<ext> and served by the server at /g/<id>.
// POST { dataUrl, kind, title } -> { id, url }
// GET                           -> { images: [{ id, url, kind, title, at }] }
// DELETE ?id=

const fs = require("fs");
const path = require("path");
const DIR = path.join(__dirname, "..", "data", "gallery");
const META = path.join(__dirname, "..", "data", "gallery.json");

function meta() { try { return JSON.parse(fs.readFileSync(META, "utf8")); } catch { return []; } }
function saveMeta(m) { fs.mkdirSync(path.dirname(META), { recursive: true }); fs.writeFileSync(META, JSON.stringify(m, null, 2)); }

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      return res.status(200).json({ images: meta().map((m) => ({ ...m, url: `/g/${m.id}` })) });
    }
    if (req.method === "POST") {
      const { dataUrl, kind, title } = req.body || {};
      const mm = String(dataUrl || "").match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
      if (!mm) return res.status(400).json({ error: "only PNG, JPG, WEBP or GIF images are allowed" });
      const ext = mm[1] === "jpeg" ? "jpg" : mm[1];
      const id = "img_" + Date.now() + "_" + Math.floor(Math.random()*1e6);
      fs.mkdirSync(DIR, { recursive: true });
      fs.writeFileSync(path.join(DIR, `${id}.${ext}`), Buffer.from(mm[2], "base64"));
      const list = meta();
      list.unshift({ id, ext, kind: kind || "other", title: title || "", at: new Date().toISOString() });
      saveMeta(list.slice(0, 500));
      return res.status(200).json({ ok: true, id, url: `/g/${id}` });
    }
    if (req.method === "DELETE") {
      const id = (req.query || {}).id;
      const rec = meta().find((m) => m.id === id);
      if (rec) { try { fs.unlinkSync(path.join(DIR, `${id}.${rec.ext}`)); } catch {} }
      saveMeta(meta().filter((m) => m.id !== id));
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: "unsupported method" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};

// Helper for the server's /g/<id> static route
module.exports.filePath = (id) => {
  const rec = meta().find((m) => m.id === id);
  return rec ? path.join(DIR, `${id}.${rec.ext}`) : null;
};
