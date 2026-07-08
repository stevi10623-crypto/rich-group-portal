// Nano Banana (Gemini 2.5 Flash Image) Headshot Studio — full option set ported
// 1:1 from Roost's imagegen.ts. Input a portrait + choices -> polished headshot.

const fs = require("fs");
const path = require("path");
const USAGE = path.join(__dirname, "..", "data", "gemini-usage.json");
const MODEL = "gemini-2.5-flash-image";
const COST_PER_IMAGE = 0.19;
const SPEND_CAP_USD = 40;

function spent() { try { return JSON.parse(fs.readFileSync(USAGE, "utf8")).spent || 0; } catch { return 0; } }
function bump(c) { fs.mkdirSync(path.dirname(USAGE), { recursive: true }); fs.writeFileSync(USAGE, JSON.stringify({ spent: spent() + c })); }

const BACKGROUNDS = [
  { key: "office", label: "Modern Office", prompt: "a modern, upscale real-estate office interior, softly blurred" },
  { key: "corneroffice", label: "Corner Office", prompt: "a bright corner office with large windows and a city view, softly blurred" },
  { key: "conference", label: "Conference Room", prompt: "a sleek modern glass conference room, softly blurred" },
  { key: "lobby", label: "Office Lobby", prompt: "an upscale office building lobby with modern finishes, softly blurred" },
  { key: "execoffice", label: "Executive Office", prompt: "a warm, wood-toned executive office with shelves, softly blurred" },
  { key: "skyline", label: "City Skyline", prompt: "a city skyline at golden hour, softly blurred behind the subject" },
  { key: "luxuryhome", label: "Luxury Home", prompt: "a bright, high-end luxury home interior, softly blurred" },
  { key: "forsale", label: "In Front of a Home", prompt: "outside a beautiful home with a tasteful, softly-blurred 'For Sale' sign" },
  { key: "beach", label: "Beach", prompt: "a scenic beach with soft ocean and sky, gently blurred" },
  { key: "library", label: "Study / Bookshelf", prompt: "a warm study with a bookshelf, softly blurred" },
  { key: "studiogray", label: "Studio Gray", prompt: "a clean, neutral medium-gray professional photography backdrop" },
  { key: "white", label: "Studio White", prompt: "a clean, bright white seamless studio backdrop" },
  { key: "greenery", label: "Outdoor Greenery", prompt: "soft natural outdoor greenery and park foliage, gently blurred" },
  { key: "brick", label: "Exposed Brick", prompt: "a stylish exposed-brick interior wall, softly blurred" },
  { key: "studioblack", label: "Studio Black", prompt: "a clean, dark charcoal-black professional studio backdrop" },
  { key: "studioblue", label: "Studio Blue", prompt: "a smooth blue-gray gradient studio backdrop" },
  { key: "cafe", label: "Café", prompt: "a warm, cozy coffee-shop interior, softly blurred" },
  { key: "rooftop", label: "Rooftop", prompt: "a stylish rooftop terrace with a city view, softly blurred" },
  { key: "kitchen", label: "Modern Kitchen", prompt: "a bright, modern kitchen interior, softly blurred" },
  { key: "porch", label: "Front Porch", prompt: "the charming front porch of a home, softly blurred" },
  { key: "downtown", label: "Downtown Street", prompt: "an upscale downtown street with storefronts, softly blurred" },
  { key: "marble", label: "Marble Lobby", prompt: "an elegant marble hotel or office lobby, softly blurred" },
  { key: "garden", label: "Garden", prompt: "a lush garden with soft greenery and flowers, gently blurred" },
  { key: "goldenhour", label: "Golden Hour", prompt: "a warm golden-hour outdoor scene, softly blurred" },
];
const ATTIRE = [
  { key: "blazer", label: "Blazer", garment: "blazer over a neat top or shirt" },
  { key: "blazertn", label: "Blazer + turtleneck", garment: "blazer over a fitted turtleneck" },
  { key: "dress", label: "Dress", garment: "professional sheath dress" },
  { key: "blouse", label: "Blouse", garment: "elegant professional blouse" },
  { key: "turtleneck", label: "Turtleneck", garment: "sleek fitted turtleneck" },
  { key: "sweater", label: "Sweater", garment: "smart sweater or fine knit top" },
  { key: "cardigan", label: "Cardigan", garment: "tailored cardigan over a neat top" },
  { key: "suit", label: "Suit", garment: "professional tailored business suit worn open-collar" },
  { key: "vest", label: "Vest", garment: "tailored vest over a button-down shirt" },
  { key: "shirt", label: "Button-down", garment: "crisp button-down shirt, no tie" },
  { key: "opencollar", label: "Open collar", garment: "relaxed open-collar dress shirt" },
  { key: "casual", label: "Smart casual", garment: "clean, put-together casual top" },
];
const COLORS = [
  { key: "navy", label: "Navy", color: "navy blue" }, { key: "black", label: "Black", color: "black" },
  { key: "charcoal", label: "Charcoal", color: "charcoal gray" }, { key: "white", label: "White", color: "crisp white" },
  { key: "cream", label: "Cream", color: "cream / ivory" }, { key: "camel", label: "Camel", color: "camel tan" },
  { key: "burgundy", label: "Burgundy", color: "deep burgundy" }, { key: "emerald", label: "Emerald", color: "emerald green" },
  { key: "royal", label: "Royal Blue", color: "royal blue" }, { key: "blush", label: "Blush", color: "soft blush pink" },
  { key: "gray", label: "Light Gray", color: "light gray" }, { key: "tan", label: "Tan", color: "tan beige" },
  { key: "skyblue", label: "Sky Blue", color: "light sky blue" }, { key: "sage", label: "Sage", color: "sage green" },
  { key: "plum", label: "Plum", color: "plum purple" },
];
const VIBES = [
  { key: "classic", label: "Classic", prompt: "classic, balanced, flattering professional lighting" },
  { key: "bright", label: "Bright & airy", prompt: "bright, airy, soft high-key lighting with a clean feel" },
  { key: "dramatic", label: "Dramatic", prompt: "refined dramatic studio lighting with gentle, tasteful shadows" },
  { key: "warm", label: "Warm", prompt: "warm, inviting, golden natural lighting" },
  { key: "bw", label: "Black & white", prompt: "classic flattering lighting, rendered as a timeless black-and-white photograph" },
];
const HAIR = [
  { key: "asis", label: "Keep as-is", prompt: "" },
  { key: "down", label: "Down", prompt: "worn down and neatly styled" },
  { key: "sleek", label: "Sleek & straight", prompt: "sleek and straight" },
  { key: "waves", label: "Soft waves", prompt: "with soft, natural waves" },
  { key: "halfup", label: "Half-up", prompt: "in a polished half-up style" },
  { key: "ponytail", label: "Ponytail", prompt: "in a sleek, neat ponytail" },
  { key: "bun", label: "Bun", prompt: "in a neat, elegant bun" },
  { key: "updo", label: "Updo", prompt: "in an elegant updo" },
];

function headshotPrompt(bgDescription, custom, attireDesc, vibeDesc, hairDesc) {
  const hairRule = hairDesc
    ? `• Style their hair ${hairDesc}, keeping their natural hair color, texture, and thickness so it looks real (not wig-like).`
    : "• Preserve their HAIR's length, style, hairline, and especially its VOLUME and FULLNESS — never flatten or thin it.";
  return [
    "Transform this photo into a POLISHED, HIGH-END professional business headshot of the SAME real person (a real-estate agent). It must look clearly more professional and studio-quality than the original snapshot — as if shot in a session with a top professional photographer, NOT just the original photo with a filter. This is a tightly cropped HEAD-AND-SHOULDERS headshot.",
    "KEEP THE PERSON (never break):",
    "• Their face, identity, age, skin tone, and unique features stay the same — clearly the same person friends would recognize. Do NOT turn them into a different person or de-age them.",
    "• Render facial features at their true, natural proportions — in particular, do NOT enlarge the nose (keep it natural). Any refinement must be subtle and flattering, never a different face.",
    hairRule,
    "• Photorealistic like a real DSLR photo, natural skin texture and pores. Subtle retouching only — NOT plastic, airbrushed, AI-looking, or a cheesy portrait.",
    "MAKE IT BETTER (apply confidently — this is the upgrade):",
    "• Pose: reframe to a clean head-and-shoulders headshot, facing the camera straight-on with the head UPRIGHT and LEVEL, square to camera. Eyes to camera, centered.",
    `• Lighting: ${vibeDesc}, with flattering catchlights in the eyes and gentle background depth of field.`,
    `• Wardrobe: dress them in ${attireDesc}, cleanly replacing their current clothing.`,
    custom
      ? "• Background: place them on the provided background image, matched in lighting direction, color, and perspective."
      : `• Background: replace the setting with ${bgDescription}.`,
    "• Light, natural makeup and grooming; a confident, warm, approachable expression.",
    "Deliver a crisp, high-end professional headshot that still unmistakably looks like them.",
    "IMPORTANT: output the clean photograph ONLY — do not ADD any text, watermarks, logos, signatures, captions, borders, or frames anywhere in the image.",
  ].join(" ");
}

async function generateHeadshot(personDataUrl, o = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { status: "not-configured", note: "Gemini (Nano Banana) not connected — set GEMINI_API_KEY." };
  const m = String(personDataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return { status: "error", note: "Your photo must be an image file." };
  if (spent() + COST_PER_IMAGE > SPEND_CAP_USD) return { status: "capped", note: `Image budget cap reached ($${SPEND_CAP_USD}).` };

  const bg = BACKGROUNDS.find((b) => b.key === o.background)?.prompt ?? BACKGROUNDS[0].prompt;
  const garment = ATTIRE.find((a) => a.key === o.attire)?.garment ?? ATTIRE[0].garment;
  const colorWord = COLORS.find((c) => c.key === o.color)?.color;
  const attireDesc = colorWord ? `a sharp, well-fitted ${colorWord} ${garment}` : `a sharp, well-fitted professional ${garment}`;
  const vibe = VIBES.find((v) => v.key === o.vibe)?.prompt ?? VIBES[0].prompt;
  const hair = HAIR.find((h) => h.key === o.hair)?.prompt ?? "";

  const parts = [{ inlineData: { mimeType: m[1], data: m[2] } }];
  let custom = false;
  if (o.customBg) {
    const bm = String(o.customBg).match(/^data:([^;]+);base64,(.+)$/);
    if (bm) { parts.push({ inlineData: { mimeType: bm[1], data: bm[2] } }); custom = true; }
  }
  parts.push({ text: headshotPrompt(bg, custom, attireDesc, vibe, hair) });
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE"] } }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return { status: "error", note: `Gemini ${res.status}: ${(await res.text()).slice(0, 160)}` };
    const data = await res.json();
    const out = (data?.candidates?.[0]?.content?.parts ?? []).find((p) => p.inlineData)?.inlineData;
    if (!out) return { status: "error", note: "Gemini returned no image" };
    bump(COST_PER_IMAGE);
    return { status: "generated", dataUrl: `data:${out.mimeType};base64,${out.data}`, note: "Generated with Nano Banana" };
  } catch (err) { return { status: "error", note: String(err.message || err) }; }
}

// Refine an already-generated headshot with a plain-language instruction.
async function editHeadshot(imageDataUrl, instruction) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { status: "not-configured", note: "Gemini (Nano Banana) not connected." };
  const m = String(imageDataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return { status: "error", note: "No image to edit." };
  if (!instruction) return { status: "error", note: "Tell it what to change." };
  if (spent() + COST_PER_IMAGE > SPEND_CAP_USD) return { status: "capped", note: `Image budget cap reached ($${SPEND_CAP_USD}).` };
  const prompt =
    `Edit this professional headshot as requested, while keeping the SAME person, their identity, face, and natural features exactly. ` +
    `Requested change: ${instruction}. ` +
    `Keep it photorealistic and high-end. Output the clean photograph ONLY — no text, watermarks, or borders.`;
  const parts = [{ inlineData: { mimeType: m[1], data: m[2] } }, { text: prompt }];
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE"] } }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return { status: "error", note: `Gemini ${res.status}: ${(await res.text()).slice(0, 160)}` };
    const data = await res.json();
    const out = (data?.candidates?.[0]?.content?.parts ?? []).find((p) => p.inlineData)?.inlineData;
    if (!out) return { status: "error", note: "Gemini returned no image" };
    bump(COST_PER_IMAGE);
    return { status: "generated", dataUrl: `data:${out.mimeType};base64,${out.data}`, note: "Edited with Nano Banana" };
  } catch (err) { return { status: "error", note: String(err.message || err) }; }
}

const OPTIONS = { backgrounds: BACKGROUNDS.map((b) => ({ key: b.key, label: b.label })), attire: ATTIRE.map((a) => ({ key: a.key, label: a.label })), colors: COLORS.map((c) => ({ key: c.key, label: c.label })), vibes: VIBES.map((v) => ({ key: v.key, label: v.label })), hair: HAIR.map((h) => ({ key: h.key, label: h.label })) };

module.exports = { generateHeadshot, editHeadshot, OPTIONS };
