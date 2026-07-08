#!/usr/bin/env node
// 6 AM research agent for The Rich Group Growth Portal.
// 1. Searches local market news (SearXNG on blackbox — free, local).
// 2. Has the writing model turn the freshest angles into lead-gen post drafts.
// 3. Deposits them in data/drafts.json → they appear in the portal's Approval Queue.
// Nothing publishes without Anita's approval. Run by cron at 6:00 AM daily.

const fs = require("fs");
const path = require("path");

const { submitImage, checkImage } = require(path.join(__dirname, "..", "api", "_lib.js"));
const ROOT = path.join(__dirname, "..");
const DRAFTS = path.join(ROOT, "data", "drafts.json");

// env
const envFile = path.join(ROOT, ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !line.trim().startsWith("#")) process.env[m[1]] = m[2];
  }
}
const SEARX = process.env.SEARXNG_URL || "http://192.168.1.146:8888";
const OLLAMA_BASE = process.env.OLLAMA_API_BASE || "https://ollama.com/v1";
const OLLAMA_KEY = process.env.OLLAMA_API_KEY || "";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b";

const TOPICS = [
  "top trending news today",
  "Los Angeles mortgage rates this week",
  "California gas prices news",
  "US economy inflation cost of living 2026",
  "Federal Reserve interest rate news",
  "Los Angeles local news this week",
  "Sherman Oaks Studio City community events",
  "California housing market 2026",
];

async function searxOnce(q, extra) {
  try {
    const res = await fetch(`${SEARX}/search?q=${encodeURIComponent(q)}&format=json${extra}`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    return ((await res.json()).results || []);
  } catch { return []; }
}
async function searx(q) {
  // Try fresh news first; fall back to a general fresh search so we always get data.
  let r = await searxOnce(q, "&categories=news&time_range=week");
  if (r.length < 2) r = await searxOnce(q, "&time_range=month");
  if (r.length < 2) r = await searxOnce(q, "");
  return r.slice(0, 5).map((x) => `- ${x.title}: ${(x.content || "").slice(0, 200)}`);
}

async function ollama(system, user) {
  const res = await fetch(`${OLLAMA_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OLLAMA_KEY}` },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: 2600,
      temperature: 0.8,
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const text = (await res.json())?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("empty model response");
  return text;
}

const SYSTEM =
  "You are the viral social + SEO marketing agent for The Rich Group, Anita Rich's Los Angeles real-estate team " +
  "(Sherman Oaks, Studio City, Valley Village, Encino; community-based; 30+ years; (818) 632-2258; therichgroup.la). Turn today's " +
  "research into SCROLL-STOPPING posts that WIN NEW CLIENTS and make Anita look INFORMED and current. Warm, expert, no hype, no invented statistics — only facts from the research.\n" +
  "HOOK STYLE: open with whatever is TRENDING today (rates, gas prices, the economy, a Fed move, tech headlines like the Chinese-AI ban, or a local LA/community happening) with a scroll-stopping first line, then connect it to what it means for buyers/sellers RIGHT NOW. Make her sound like the smart local expert who is on top of the news. STAY NON-PARTISAN: never take a political side or name-call; frame news only in terms of what it means for someone's home, money, or move, so it never alienates a client. Lean into her COMMUNITY roots (local events, neighborhood pride).\n" +
  "WRITE LIKE A REAL HUMAN, NOT AI (most important): it must read like Anita typed it herself, not a generated ad. BANNED words/tells: nestled, boasts, elevate, unparalleled, stunning, dive in, in the heart of, look no further, discover, unlock, testament to, when it comes to, the perfect blend, excessive em-dashes, stiff parallel structure. DO: mix short and long sentences, plain everyday words, a specific real detail, contractions, a natural human aside; at most 1-2 emojis (often zero).\n" +
  "EVERY post MUST end with (a) a strong call-to-action — one of: 'Get your free home valuation at therichgroup.la', " +
  "'Call or text (818) 632-2258', 'DM us to talk' — and (b) relevant local hashtags.\n" +
  "HASHTAGS: Facebook 3-4, Instagram 6-8, Google Post 0. Mix broad + hyperlocal, e.g. #ShermanOaksRealEstate #StudioCityHomes " +
  "#SFVRealEstate #LARealEstate #ValleyVillage #JustListed #HomeValuation #RichGroup.\n" +
  "Return STRICT JSON only: an array of exactly 3 objects, each " +
  "{\"platform\":\"facebook\"|\"instagram\"|\"gbp\",\"title\":\"...\",\"body\":\"...(full post incl. CTA + hashtags)\",\"image_scene\":\"a short VISUAL description of an on-brand LA real-estate scene for this post — a golden-hour street, luxury home exterior, or neighborhood view; NO text, NO people, NO specific address\"}. " +
  "One post per platform: facebook, instagram, gbp.";

async function main() {
  const stamp = new Date().toISOString();
  console.log(`[${stamp}] research agent starting`);

  // 1. research
  const findings = [];
  for (const t of TOPICS) {
    try {
      const r = await searx(t);
      if (r.length) findings.push(`## ${t}\n${r.join("\n")}`);
    } catch (e) {
      console.log(`  search failed for "${t}": ${e.message}`);
    }
  }
  if (!findings.length) {
    console.log("  no research results — writing evergreen lead-gen posts instead");
    findings.push("## No fresh news today\nWrite evergreen local posts: free home valuation offer, why hire a 30-year local expert, neighborhood spotlight.");
  }

  // 2. write drafts
  const raw = await ollama(SYSTEM, `Today's research:\n\n${findings.join("\n\n")}\n\nWrite the 3 posts now. STRICT JSON array only.`);
  // Robust extraction: strip fences, slice the array, tolerate a truncated tail.
  let posts;
  try {
    const clean = raw.replace(/```(json)?/g, "").trim();
    const start = clean.indexOf("[");
    let body = start >= 0 ? clean.slice(start) : clean;
    const end = body.lastIndexOf("]");
    if (end >= 0) body = body.slice(0, end + 1);
    posts = JSON.parse(body);
  } catch (e) {
    // last resort: pull each {...} object individually
    posts = (raw.match(/\{[^{}]*"platform"[^{}]*\}/g) || []).map((x) => { try { return JSON.parse(x); } catch { return null; } }).filter(Boolean);
    if (!posts.length) throw e;
  }

  // 3. generate an on-brand image for each post (Z-Image on the 3090)
  async function genImage(scene) {
    try {
      const pid = await submitImage(scene || "an upscale Los Angeles neighborhood street at golden hour", "square", "draft");
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const st = await checkImage(pid, "draft");
        if (st.status === "done") return st.image;
        if (st.status === "error") return null;
      }
    } catch (e) { console.log("  image failed:", e.message); }
    return null;
  }

  const images = [];
  for (const p of posts) { images.push(await genImage(p.image_scene)); }

  // 4. deposit into the portal queue store
  const items = posts.map((p, i) => ({
    id: `agent_${Date.now()}_${i}`,
    tag: p.platform === "gbp" ? "t-gbp" : "t-social",
    label: p.platform === "gbp" ? "Google Post" : p.platform === "instagram" ? "Instagram" : "Facebook",
    publish: p.platform !== "gbp",
    platforms: [p.platform],
    ttl: `☀ Morning agent — ${p.title}`,
    when: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " 6am research",
    body: p.body,
    image: images[i] || null,
  }));

  fs.mkdirSync(path.dirname(DRAFTS), { recursive: true });
  let list = [];
  try { list = JSON.parse(fs.readFileSync(DRAFTS, "utf8")); } catch {}
  // drop yesterday's un-actioned agent drafts so the queue doesn't pile up
  list = list.filter((d) => !String(d.id).startsWith("agent_"));
  list.unshift(...items);
  fs.writeFileSync(DRAFTS, JSON.stringify(list.slice(0, 100), null, 2));
  console.log(`[${new Date().toISOString()}] deposited ${items.length} drafts -> ${DRAFTS}`);
}

main()
  .then(() => require(require("path").join(__dirname, "..", "api", "rank.js")).runCheck())
  .then((r) => console.log(`rank check recorded (${r.rows.length} keywords)`))
  .catch((e) => { console.error("agent failed:", e.message); process.exit(1); });
