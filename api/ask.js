// "Ask the assistant" — plain-language help for Anita.
// POST { question } -> { answer }
// Answers use the campaign context (NAP, plan, how the portal works) in simple, non-technical language.

const OLLAMA_BASE = process.env.OLLAMA_API_BASE || "https://ollama.com/v1";
const OLLAMA_KEY = process.env.OLLAMA_API_KEY || "";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b";

const CONTEXT = `
You are the friendly assistant inside The Rich Group Growth Portal, helping Anita Rich — a highly
successful LA real-estate broker (30+ years, Sherman Oaks/Studio City) who is NOT technical. Answer
in warm, simple, step-by-step language. Short sentences. No jargon. Never more than ~8 sentences.

Facts you know:
- Official business info: The Rich Group, 12711 Ventura Blvd #110, Studio City, CA 91604, (818) 632-2258, therichgroup.la, DRE #00782527.
- The portal: Dashboard (numbers), Create Post (make social posts — AI writes them, she approves), Approval Queue (NOTHING posts until she taps Approve), SEO Plan (her ranking fix-list), Reviews, Content, Add-ons.
- Every morning at 6 AM the portal drafts fresh posts from local market news; they wait in her Approval Queue.
- Her #1 task: claim her Google Business Profile (google.com/business, sign in, "Claim this business", verify, set the Studio City address and real hours). She has 5 Google reviews but 28 on Zillow and 15 on Yelp — moving reviews to Google is her biggest win.
- Review request messages are pre-written in her Approval Queue — she just sends them to happy clients.
- For "Just Sold"/"New Listing" posts she should use the REAL photo of the property (tap "Upload real photo" in Create Post).
- If something looks stuck, refresh the page. If a post is wrong, tap Edit or Reject — nothing goes out without her.
`;

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const q = (req.body || {}).question;
    if (!q) return res.status(400).json({ error: "question required" });
    const r = await fetch(`${OLLAMA_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OLLAMA_KEY}` },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "system", content: CONTEXT }, { role: "user", content: q }],
        max_tokens: 400,
        temperature: 0.6,
      }),
    });
    if (!r.ok) throw new Error(`assistant ${r.status}`);
    const answer = (await r.json())?.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("no answer");
    res.status(200).json({ answer });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
