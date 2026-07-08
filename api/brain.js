// The Brain — per-agent knowledge the AI recalls and honors in everything it writes.
// Ported (file-based) from Roost's brain_entries. Anita teaches it facts/preferences;
// it also LEARNS automatically from her edits & rejections. Injected into every caption.
// GET -> { entries } ; POST { text, source } -> add ; DELETE ?id=

const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "data", "brain.json");

const SEED = [
  { id: "seed_voice", text: "Write like Anita actually typed it — warm, real, specific, never salesy or AI-sounding.", source: "seed", at: null },
  { id: "seed_area", text: "Core areas: Sherman Oaks, Studio City, Valley Village, Encino. 30+ years, community-based.", source: "seed", at: null },
];

function load() { try { const d = JSON.parse(fs.readFileSync(FILE, "utf8")); return Array.isArray(d) ? d : SEED; } catch { return SEED; } }
function store(l) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(l, null, 2)); }

// A trusted-context block to inject into any generation system prompt.
function brainBlock() {
  const e = load();
  if (!e.length) return "";
  return "WHAT ANITA HAS TAUGHT YOU (always honor these):\n" + e.map((x) => `- ${x.text}`).join("\n");
}

// Called by other routes to auto-learn (e.g. from a rejection reason or an edit).
function learn(text, source) {
  if (!text || !text.trim()) return;
  const l = load();
  // avoid near-duplicates
  if (l.some((x) => x.text.trim().toLowerCase() === text.trim().toLowerCase())) return;
  l.unshift({ id: "learn_" + Date.now(), text: text.trim().slice(0, 300), source: source || "learned", at: new Date().toISOString() });
  store(l.slice(0, 200));
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") return res.status(200).json({ entries: load() });
    if (req.method === "POST") {
      const { text, source, category } = req.body || {};
      if (!text) return res.status(400).json({ error: "text required" });
      const l = load();
      l.unshift({ id: "b_" + Date.now(), text: String(text).slice(0, 400), source: source || "taught", category: category || "general", at: new Date().toISOString() });
      store(l.slice(0, 200));
      return res.status(200).json({ ok: true });
    }
    if (req.method === "DELETE") {
      store(load().filter((x) => x.id !== (req.query || {}).id));
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: "unsupported method" });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
};
module.exports.brainBlock = brainBlock;
module.exports.learn = learn;
