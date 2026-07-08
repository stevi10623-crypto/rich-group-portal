// Nano Banana (Gemini 2.5 Flash Image) — ported from Roost's Headshot Studio.
// Input a portrait + choices -> a polished professional headshot. Local $-cap.

const fs = require("fs");
const path = require("path");
const USAGE = path.join(__dirname, "..", "data", "gemini-usage.json");
const MODEL = "gemini-2.5-flash-image";
const COST_PER_IMAGE = 0.19;
const SPEND_CAP_USD = 25;

function spent() { try { return JSON.parse(fs.readFileSync(USAGE, "utf8")).spent || 0; } catch { return 0; } }
function bump(c) {
  fs.mkdirSync(path.dirname(USAGE), { recursive: true });
  fs.writeFileSync(USAGE, JSON.stringify({ spent: spent() + c }));
}

const BACKGROUNDS = {
  office: "a bright modern office with soft depth of field",
  luxuryhome: "an elegant luxury home interior, tasteful and upscale",
  forsale: "standing in front of a beautiful for-sale home, softly blurred",
  studiogray: "a clean neutral gray photography studio backdrop",
  white: "a bright studio white backdrop",
  skyline: "a softly blurred city skyline at golden hour",
  library: "a warm study with a bookshelf, softly blurred",
  greenery: "soft outdoor greenery, natural light",
};
const ATTIRE = {
  blazer: "a sharp, well-fitted blazer",
  suit: "a sharp, well-fitted suit (no tie)",
  blouse: "an elegant professional blouse",
  shirt: "a crisp button-down shirt",
  dress: "a polished professional dress",
  turtleneck: "a refined turtleneck",
};
const VIBES = {
  bright: "bright, clean, evenly-lit professional studio lighting",
  warm: "warm, soft, flattering natural light",
  dramatic: "polished editorial lighting with gentle contrast",
};

function headshotPrompt(bg, attire, vibe) {
  return [
    "Transform this photo into a POLISHED, HIGH-END professional business headshot of the SAME real person (a real-estate agent). It must look clearly more professional and studio-quality than the original snapshot — as if shot by a top professional photographer, NOT the original with a filter. Tightly cropped HEAD-AND-SHOULDERS.",
    "KEEP THE PERSON: their face, identity, age, skin tone, and unique features stay the same — clearly the same person. Render features at natural proportions (do NOT enlarge the nose). Preserve hair length, style, hairline, volume and fullness. Photorealistic DSLR look, natural skin texture, subtle retouching only — not plastic or AI-looking.",
    "MAKE IT BETTER: reframe to a clean head-and-shoulders headshot, head upright and level, square to camera, eyes to camera, centered.",
    `Lighting: ${vibe}, with flattering catchlights and gentle background depth of field.`,
    `Wardrobe: dress them in ${attire}, cleanly replacing current clothing.`,
    `Background: replace the setting with ${bg}.`,
    "Light natural makeup and grooming; a confident, warm, approachable expression.",
    "IMPORTANT: output the clean photograph ONLY — no text, watermarks, logos, signatures, captions, borders, or frames anywhere.",
  ].join(" ");
}

async function generateHeadshot(personDataUrl, backgroundKey, attireKey, vibeKey) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { status: "not-configured", note: "Gemini (Nano Banana) not connected — set GEMINI_API_KEY." };
  const m = String(personDataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return { status: "error", note: "Your photo must be an image file." };
  if (spent() + COST_PER_IMAGE > SPEND_CAP_USD) return { status: "capped", note: `Image budget cap reached ($${SPEND_CAP_USD}).` };

  const bg = BACKGROUNDS[backgroundKey] || BACKGROUNDS.office;
  const attire = ATTIRE[attireKey] || ATTIRE.blazer;
  const vibe = VIBES[vibeKey] || VIBES.bright;
  const parts = [{ inlineData: { mimeType: m[1], data: m[2] } }, { text: headshotPrompt(bg, attire, vibe) }];
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE"] } }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return { status: "error", note: `Gemini ${res.status}: ${(await res.text()).slice(0, 160)}` };
    const data = await res.json();
    const out = (data?.candidates?.[0]?.content?.parts ?? []).find((p) => p.inlineData)?.inlineData;
    if (!out) return { status: "error", note: "Gemini returned no image" };
    bump(COST_PER_IMAGE);
    return { status: "generated", dataUrl: `data:${out.mimeType};base64,${out.data}`, note: "Generated with Nano Banana (Gemini 2.5 Flash Image)" };
  } catch (err) {
    return { status: "error", note: String(err.message || err) };
  }
}

const OPTIONS = {
  backgrounds: Object.keys(BACKGROUNDS).map((k) => ({ key: k, label: k })),
  attire: Object.keys(ATTIRE).map((k) => ({ key: k, label: k })),
  vibes: Object.keys(VIBES).map((k) => ({ key: k, label: k })),
};

module.exports = { generateHeadshot, OPTIONS };
