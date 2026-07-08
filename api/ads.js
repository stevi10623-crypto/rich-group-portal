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
  const res = await fetch(`${OLLAMA_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OLLAMA_KEY}` },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: max || 600, temperature: 0.7 }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const t = (await res.json())?.choices?.[0]?.message?.content?.trim();
  if (!t) throw new Error("empty response");
  return t;
}

const BRAND = "The Rich Group — Anita Rich, LA real estate (Sherman Oaks, Studio City, Valley Village; 30+ years; (818) 632-2258; therichgroup.la). No hype, no fake stats.";

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
      const sys = `You write high-converting ${platform} ads for a real-estate agent. ${BRAND} Return the ad ready to paste: a punchy HEADLINE line, then PRIMARY TEXT (2-4 sentences), then a clear CALL TO ACTION. For Google, give 3 headlines (<30 chars) + 2 descriptions (<90 chars). No fake statistics.`;
      const text = await ollama(sys, `Goal: ${goal}. Extra notes: ${b.brief || "none"}. Write the ad now.`, 500);
      const ad = { id: "ad_" + (cur.ads.length + 1), at: new Date().toISOString(), platform, goal, text };
      cur.ads.unshift(ad); store({ ...cur, ads: cur.ads.slice(0, 50) });
      return res.status(200).json({ ok: true, ad });
    }
    res.status(400).json({ error: "unknown action" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
