// Ad placement engine: an UPDATABLE strategy summary + AI ad-copy generator
// for Facebook / Instagram / Google. Strategy is regenerated as things change.

const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "data", "ads.json");

const OLLAMA_BASE = process.env.OLLAMA_API_BASE || "https://ollama.com/v1";
const OLLAMA_KEY = process.env.OLLAMA_API_KEY || "";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b";

const DEFAULT_STRATEGY = {
  updatedAt: null,
  summary:
    "Recommended ad mix for The Rich Group right now:\n\n" +
    "• GOOGLE Search (highest intent) — bid on 'Sherman Oaks realtor', 'sell my Studio City home', 'home value Sherman Oaks'. Send clicks to the free-valuation landing page. Best $ for seller leads.\n" +
    "• FACEBOOK/INSTAGRAM (awareness + retargeting) — run a 'What's your home worth?' lead form to Valley homeowners 35-65, plus retarget website visitors. Cheap leads, warms the brand.\n" +
    "• Budget split to start: 60% Google Search, 30% Meta lead ads, 10% Meta retargeting. Start at $20-40/day, scale winners.\n" +
    "• Every ad points to the free-valuation landing page and captures name + phone → shows up under Leads.",
  platforms: [
    { name: "Google Search", goal: "Seller & buyer leads (high intent)", budget: "60%" },
    { name: "Facebook / Instagram Lead Ads", goal: "Cheap home-valuation leads", budget: "30%" },
    { name: "Meta Retargeting", goal: "Re-engage website visitors", budget: "10%" },
  ],
};

function load() { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return { strategy: DEFAULT_STRATEGY, ads: [] }; } }
function store(o) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o, null, 2)); }

async function ollama(system, user, max) {
  // gpt-oss occasionally returns empty content — retry up to 3x before giving up.
  let lastErr = "empty response";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${OLLAMA_BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OLLAMA_KEY}` },
        body: JSON.stringify({ model: OLLAMA_MODEL, messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: max || 600, temperature: 0.7 }),
        signal: AbortSignal.timeout(90000),
      });
      if (!res.ok) { lastErr = `Ollama ${res.status}`; continue; }
      const t = (await res.json())?.choices?.[0]?.message?.content?.trim();
      if (t) return t;
    } catch (e) { lastErr = String(e.message || e); }
  }
  throw new Error(lastErr);
}

const BRAND = "The Rich Group — Anita Rich, LA real estate (Sherman Oaks, Studio City, Valley Village; 30+ years; (818) 632-2258; therichgroup.la). No hype, no fake stats.";

function jsonExtract(raw) {
  let clean = String(raw || "").replace(/```(json)?/g, "").trim();
  const s = clean.indexOf("{");
  if (s < 0) return null;
  clean = clean.slice(s);
  const e = clean.lastIndexOf("}");
  if (e > 0) { try { return JSON.parse(clean.slice(0, e + 1)); } catch {} }
  // repair a truncated object: close a dangling string, drop trailing comma, add }
  let repaired = clean.replace(/,\s*$/, "");
  const quotes = (repaired.match(/"/g) || []).length;
  if (quotes % 2 === 1) repaired += '"';
  repaired += "}";
  try { return JSON.parse(repaired); } catch {}
  return null;
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") return res.status(200).json(load());
    const b = req.body || {};
    const cur = load();

    if (b.action === "save-strategy") {
      cur.strategy = { ...cur.strategy, summary: b.summary, updatedAt: new Date().toISOString() };
      store(cur); return res.status(200).json({ ok: true, strategy: cur.strategy });
    }
    if (b.action === "refresh-strategy") {
      const sys = "You are a performance-marketing strategist for a local real-estate agent. Write a concise, practical ad strategy (bullet points): which platforms (Google Search, Meta lead ads, retargeting), targeting, budget split, and what each ad should promote to WIN listing/buyer clients. " + BRAND;
      const summary = await ollama(sys, "Write the current best ad strategy. Keep it under 180 words, bullet points, actionable.", 500);
      cur.strategy = { ...cur.strategy, summary, updatedAt: new Date().toISOString() };
      store(cur); return res.status(200).json({ ok: true, strategy: cur.strategy });
    }
    if (b.action === "generate-ad") {
      const platform = b.platform || "facebook";
      const goal = b.goal || "get home-valuation leads";
      const human = "Sound like a real person, NOT AI — no clichés (nestled, boasts, unparalleled, discover, elevate), no markdown, no asterisks.";
      let sys, ad;
      if (platform === "google") {
        sys = `You write Google Search ads for a real-estate agent. ${BRAND} ${human} Return STRICT JSON only: {"headlines":["h1","h2","h3"],"descriptions":["d1","d2"]}. Headlines must be <=30 characters each, descriptions <=90 characters each. No fake statistics.`;
        const raw = await ollama(sys, `Goal: ${goal}. Notes: ${b.brief || "none"}. Write it now, JSON only.`, 800);
        const f = jsonExtract(raw) || { headlines: [], descriptions: [] };
        ad = { id: "ad_" + (cur.ads.length + 1), at: new Date().toISOString(), platform, goal, fields: { google: f } };
      } else {
        sys = `You write ${platform} lead ads for a real-estate agent. ${BRAND} ${human} Return STRICT JSON only: {"headline":"short headline (<=40 chars)","primaryText":"2-3 warm human sentences","description":"one short line","cta":"one of: Learn More, Get Quote, Sign Up, Contact Us","hashtags":"3-5 hashtags or empty"}. No fake statistics.`;
        const raw = await ollama(sys, `Goal: ${goal}. Notes: ${b.brief || "none"}. Write it now, JSON only.`, 800);
        const f = jsonExtract(raw) || { headline: "", primaryText: raw, cta: "Learn More" };
        ad = { id: "ad_" + (cur.ads.length + 1), at: new Date().toISOString(), platform, goal, fields: { meta: f } };
      }
      cur.ads.unshift(ad); store({ ...cur, ads: cur.ads.slice(0, 50) });
      return res.status(200).json({ ok: true, ad });
    }
    res.status(400).json({ error: "unknown action" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
