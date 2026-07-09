// "Anita Brain 2.0" — an ENCRYPTED password vault.
// This endpoint is deliberately dumb: it only stores and returns an opaque,
// already-encrypted blob. All encryption/decryption happens in Anita's browser
// with a vault password that never leaves her device, so the server (and anyone
// who somehow reaches this API) only ever sees unreadable ciphertext.
//
// GET            -> { blob }   (the stored ciphertext, or null if not set up)
// POST { blob }  -> stores the ciphertext blob

const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "data", "vault.json");

function load() { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return { blob: null }; } }
function store(o) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o, null, 2)); }

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") return res.status(200).json(load());
    if (req.method === "POST") {
      const blob = (req.body || {}).blob;
      if (typeof blob !== "object" || !blob) return res.status(400).json({ error: "blob required" });
      // Basic shape check — we never inspect the contents, just that it looks like our envelope.
      if (!blob.salt || !blob.iv || !blob.ct) return res.status(400).json({ error: "malformed blob" });
      store({ blob, updatedAt: new Date().toISOString() });
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: "unsupported method" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
