// Server-side drafts store — where the 6 AM research agent deposits post drafts.
// GET    -> { drafts: [...] }
// POST   { items: [...] } -> appends (agent use)
// DELETE ?id= -> removes one (after approve/reject so it doesn't come back)

const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "data", "drafts.json");

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return []; }
}
function store(list) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") return res.status(200).json({ drafts: load() });
    if (req.method === "POST") {
      const items = (req.body || {}).items;
      if (!Array.isArray(items)) return res.status(400).json({ error: "items[] required" });
      const list = load();
      list.unshift(...items);
      store(list.slice(0, 100)); // keep the store bounded
      return res.status(200).json({ ok: true, count: list.length });
    }
    if (req.method === "DELETE") {
      const id = (req.query || {}).id;
      if (!id) return res.status(400).json({ error: "id required" });
      store(load().filter((d) => d.id !== id));
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: "unsupported method" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
