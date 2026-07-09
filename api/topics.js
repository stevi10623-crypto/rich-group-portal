// On-demand post-idea engine: search trending + local topics, return a picklist
// of post ideas Anita can turn into a draft. Higher-end research feature.
// POST { focus?: string } -> { ideas: [{ title, angle }] }

const SEARX = process.env.SEARXNG_URL || "http://192.168.1.146:8888";
const OLLAMA_BASE = process.env.OLLAMA_API_BASE || "https://ollama.com/v1";
const OLLAMA_KEY = process.env.OLLAMA_API_KEY || "";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b";

async function searx(q) {
  try {
    const res = await fetch(`${SEARX}/search?q=${encodeURIComponent(q)}&format=json&time_range=month`, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    return ((await res.json()).results || []).slice(0, 4).map((r) => `- ${r.title}`);
  } catch { return []; }
}

async function ollama(system, user, max) {
  let last = "empty response";
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${OLLAMA_BASE}/chat/completions`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${OLLAMA_KEY}` },
        body: JSON.stringify({ model: OLLAMA_MODEL, messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: max || 700, temperature: 0.8 }),
        signal: AbortSignal.timeout(90000),
      });
      if (!res.ok) { last = `Ollama ${res.status}`; continue; }
      const t = (await res.json())?.choices?.[0]?.message?.content?.trim();
      if (t) return t;
    } catch (e) { last = String(e.message || e); }
  }
  throw new Error(last);
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const focus = (req.body || {}).focus || "";
    const queries = focus
      ? [focus + " Sherman Oaks Los Angeles real estate", focus + " news"]
      : [
          "Los Angeles mortgage rates news",
          "Sherman Oaks Studio City Encino housing market",
          "Van Nuys North Hollywood Toluca Lake Tarzana real estate news",
          "top trending news today",
        ];
    const findings = [];
    for (const q of queries) { const r = await searx(q); if (r.length) findings.push(`## ${q}\n${r.join("\n")}`); }

    const sys =
      "You are a real-estate content strategist for The Rich Group (Anita Rich, Sherman Oaks/Studio City). " +
      "Suggest 14 SPECIFIC, timely post ideas she could post about TODAY that would grab attention and win clients. Mix trending-news angles " +
      "(rates, the economy, local LA happenings, tech/culture headlines) with evergreen local real-estate ideas. Each must be genuinely useful, " +
      "non-partisan, human, and accurate — do NOT invent fake sales, addresses, or statistics. " +
      "Output EXACTLY 14 lines, each: `Title | one-line angle`. No numbering, no markdown.";
    const raw = await ollama(sys, `Recent context:\n${findings.join("\n\n") || "(no fresh results — use evergreen local ideas)"}\n\nGive the 14 ideas now.`, 1400);
    const ideas = raw.split("\n").map((l) => l.trim()).filter((l) => l.includes("|")).slice(0, 15)
      .map((l) => { const [title, ...rest] = l.replace(/^[-*\d.\s]+/, "").split("|"); return { title: title.trim(), angle: rest.join("|").trim() }; });
    res.status(200).json({ ideas });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
