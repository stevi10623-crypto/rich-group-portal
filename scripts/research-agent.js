#!/usr/bin/env node
// 6 AM research agent for The Rich Group Growth Portal.
// 1. Searches local market news (SearXNG on blackbox — free, local).
// 2. Has the writing model turn the freshest angles into lead-gen post drafts.
// 3. Deposits them in data/drafts.json → they appear in the portal's Approval Queue.
// Nothing publishes without Anita's approval. Run by cron at 6:00 AM daily.

const fs = require("fs");
const path = require("path");

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
  "Sherman Oaks housing market 2026",
  "Studio City real estate news",
  "San Fernando Valley home prices",
  "Los Angeles mortgage rates this week",
];

async function searx(q) {
  const res = await fetch(`${SEARX}/search?q=${encodeURIComponent(q)}&format=json&time_range=week`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).slice(0, 4).map((r) => `- ${r.title}: ${(r.content || "").slice(0, 180)}`);
}

async function ollama(system, user) {
  const res = await fetch(`${OLLAMA_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OLLAMA_KEY}` },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: 1200,
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
  "You are the marketing strategist for The Rich Group, Anita Rich's Los Angeles real-estate team " +
  "(Sherman Oaks, Studio City, Valley Village; 30+ years; (818) 632-2258). Your job: turn today's market " +
  "research into posts that ATTRACT NEW CLIENTS — every post ends with a clear next step (free home valuation, " +
  "call/text, DM). Warm, expert, zero hype, no invented statistics — only use numbers that appear in the research. " +
  "Return STRICT JSON only: an array of exactly 3 objects, each {\"platform\":\"facebook\"|\"instagram\"|\"gbp\",\"title\":\"...\",\"body\":\"...\"}. " +
  "One post per platform. Instagram gets hashtags; Google (gbp) gets the phone number; Facebook is 3-5 warm sentences.";

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
  const jsonText = raw.replace(/^```(json)?|```$/gm, "").trim();
  const posts = JSON.parse(jsonText);

  // 3. deposit into the portal queue store
  const items = posts.map((p, i) => ({
    id: `agent_${Date.now()}_${i}`,
    tag: p.platform === "gbp" ? "t-gbp" : "t-social",
    label: p.platform === "gbp" ? "Google Post" : p.platform === "instagram" ? "Instagram" : "Facebook",
    publish: p.platform !== "gbp",
    platforms: [p.platform],
    ttl: `☀ Morning agent — ${p.title}`,
    when: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " 6am research",
    body: p.body,
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

main().catch((e) => { console.error("agent failed:", e.message); process.exit(1); });
