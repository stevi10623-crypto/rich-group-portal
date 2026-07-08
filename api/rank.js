// Live keyword rank checker — where does therichgroup.la place in search results?
// Uses SearXNG (local metasearch) server-side. Results cached with history in data/rank.json.
// GET          -> { checks: [...] } (latest + history)
// POST         -> runs a fresh check now, returns results

const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "data", "rank.json");

const SEARX = process.env.SEARXNG_URL || "http://192.168.1.146:8888";
const DOMAIN = "therichgroup.la";
const KEYWORDS = [
  "Sherman Oaks real estate agent",
  "Studio City real estate agent",
  "Sherman Oaks homes for sale",
  "best realtor Sherman Oaks",
  "Valley Village homes for sale",
];

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return { history: [] }; }
}

async function checkKeyword(q) {
  const res = await fetch(`${SEARX}/search?q=${encodeURIComponent(q)}&format=json`, {
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return { keyword: q, position: null, topResult: null, error: `search ${res.status}` };
  const data = await res.json();
  const results = data.results || [];
  let position = null;
  for (let i = 0; i < results.length; i++) {
    if ((results[i].url || "").includes(DOMAIN)) { position = i + 1; break; }
  }
  return {
    keyword: q,
    position, // null = not in results
    checked: results.length,
    topResult: results[0] ? { title: results[0].title, url: results[0].url } : null,
  };
}

async function runCheck() {
  const rows = [];
  for (const k of KEYWORDS) {
    try { rows.push(await checkKeyword(k)); }
    catch (e) { rows.push({ keyword: k, position: null, error: e.message }); }
  }
  const entry = { at: new Date().toISOString(), rows };
  const store = load();
  store.latest = entry;
  store.history = [...(store.history || []), { at: entry.at, positions: rows.map((r) => ({ k: r.keyword, p: r.position })) }].slice(-60);
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(store, null, 2));
  return entry;
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") return res.status(200).json(load());
    if (req.method === "POST") return res.status(200).json(await runCheck());
    res.status(405).json({ error: "unsupported method" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
module.exports.runCheck = runCheck;
