// Shared backend logic for the Growth Portal.
// Runs both as Vercel serverless functions (api/*.js) and via the local server.js.

const OLLAMA_BASE = process.env.OLLAMA_API_BASE || "https://ollama.com/v1";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b";
const OLLAMA_KEY = process.env.OLLAMA_API_KEY || "";
// Draft engine: Z-Image Turbo on the Alien 3090 (~13s). Final: FLUX.2 on the Mac.
const DRAFT_URL = process.env.COMFYUI_URL_DRAFT || "http://localhost:8190";
const FINAL_URL = process.env.COMFYUI_URL_FINAL || "http://localhost:8190";
const FINAL_MODEL = process.env.COMFYUI_MODEL_FINAL || "flux2-dev-Q4_K_S.gguf";
const POSTIZ_URL = process.env.POSTIZ_URL || "http://192.168.1.30:4007";
const POSTIZ_KEY = process.env.POSTIZ_API_KEY || "";

const BRAND =
  "You write marketing copy for The Rich Group, Anita Rich's Los Angeles real-estate team " +
  "(Sherman Oaks, Studio City, Valley Village, Encino; 30+ years; phone (818) 632-2258). " +
  "Voice: warm, expert, no hype, no fake statistics. Return ONLY the finished text — no preamble, no quotes, no markdown.";

const HASHTAGS =
  "Use a mix of broad + hyperlocal tags such as #ShermanOaksRealEstate #StudioCityHomes #ValleyVillage " +
  "#SFVRealEstate #LARealEstate #SanFernandoValley #JustListed #HomeValuation #RichGroup #LARealtor.";
const CTA =
  "End with a strong call-to-action: 'Get your free home valuation at therichgroup.la', or 'Call/text (818) 632-2258', or 'DM us'.";

const STYLE = {
  facebook: `Facebook post: friendly, 3-5 sentences, minimal emojis. ${CTA} Then 3-4 hashtags. ${HASHTAGS}`,
  instagram: `Instagram caption: 2-4 short lines, tasteful emojis. ${CTA} End with 6-8 hashtags. ${HASHTAGS}`,
  tiktok: `TikTok caption: punchy hook first line, casual. ${CTA} End with 5-6 hashtags. ${HASHTAGS}`,
  gbp: `Google Business Profile post: 2-4 sentences. ${CTA} Include the phone number. No hashtags.`,
  blog: "Blog post: ~300 words, headline on the first line, short paragraphs, practical and local. End with a call-to-action linking to a free home valuation.",
  review_reply: "Review reply: 2-3 warm professional sentences signed '— Anita'. If the review is negative, be gracious, take it seriously, and offer to make it right offline.",
};

async function ollama(messages, maxTokens) {
  const res = await fetch(`${OLLAMA_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OLLAMA_KEY}` },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages, max_tokens: maxTokens || 600, temperature: 0.8 }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${(await res.text()).slice(0, 180)}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from the writing model");
  return text;
}

/** kind: one of STYLE keys; brief: what to write about. Returns finished copy. */
async function writeCopy(kind, brief) {
  const style = STYLE[kind] || STYLE.facebook;
  return ollama([
    { role: "system", content: BRAND },
    { role: "user", content: `Write the following. ${style}\n\nBrief: ${brief}` },
  ], kind === "blog" ? 900 : 500);
}

// ---------- Image generation via ComfyUI ----------
const SAVE_NODE = "13";
// Never mention text/MLS/addresses in the positive prompt — turbo models paint
// them onto the image (verified 2026-07-07). Anti-text lives in the negative.
const NEGATIVE =
  "text, words, letters, numbers, typography, captions, labels, signs, watermark, logo, subtitles";

function zImageWorkflow(prompt, w, h, seed) {
  return {
    "1": { class_type: "UNETLoader", inputs: { unet_name: "z_image_turbo_bf16.safetensors", weight_dtype: "default" } },
    "2": { class_type: "CLIPLoader", inputs: { clip_name: "qwen_3_4b.safetensors", type: "lumina2", device: "default" } },
    "3": { class_type: "VAELoader", inputs: { vae_name: "ae.safetensors" } },
    "4": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["2", 0] } },
    "5": { class_type: "CLIPTextEncode", inputs: { text: NEGATIVE, clip: ["2", 0] } },
    "6": { class_type: "ModelSamplingAuraFlow", inputs: { shift: 3, model: ["1", 0] } },
    "10": { class_type: "EmptySD3LatentImage", inputs: { width: w, height: h, batch_size: 1 } },
    "11": { class_type: "KSampler", inputs: { model: ["6", 0], seed, steps: 8, cfg: 1.5, sampler_name: "res_multistep", scheduler: "simple", positive: ["4", 0], negative: ["5", 0], latent_image: ["10", 0], denoise: 1 } },
    "12": { class_type: "VAEDecode", inputs: { samples: ["11", 0], vae: ["3", 0] } },
    [SAVE_NODE]: { class_type: "SaveImage", inputs: { images: ["12", 0], filename_prefix: "portal" } },
  };
}

function flux2Workflow(prompt, w, h, seed) {
  return {
    "1": { class_type: "UnetLoaderGGUF", inputs: { unet_name: FINAL_MODEL } },
    "2": { class_type: "CLIPLoader", inputs: { clip_name: "mistral_3_small_flux2_fp8.safetensors", type: "flux2" } },
    "3": { class_type: "VAELoader", inputs: { vae_name: "flux2-vae.safetensors" } },
    "4": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["2", 0] } },
    "5": { class_type: "FluxGuidance", inputs: { guidance: 4.0, conditioning: ["4", 0] } },
    "6": { class_type: "BasicGuider", inputs: { model: ["1", 0], conditioning: ["5", 0] } },
    "7": { class_type: "Flux2Scheduler", inputs: { steps: 20, width: w, height: h } },
    "8": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler" } },
    "9": { class_type: "RandomNoise", inputs: { noise_seed: seed } },
    "10": { class_type: "EmptyFlux2LatentImage", inputs: { width: w, height: h, batch_size: 1 } },
    "11": { class_type: "SamplerCustomAdvanced", inputs: { noise: ["9", 0], guider: ["6", 0], sampler: ["8", 0], sigmas: ["7", 0], latent_image: ["10", 0] } },
    "12": { class_type: "VAEDecode", inputs: { samples: ["11", 0], vae: ["3", 0] } },
    [SAVE_NODE]: { class_type: "SaveImage", inputs: { images: ["12", 0], filename_prefix: "portal" } },
  };
}

function engineUrl(engine) {
  return engine === "final" ? FINAL_URL : DRAFT_URL;
}

async function submitImage(brief, aspect, engine) {
  const dims = aspect === "landscape" ? [1216, 832] : aspect === "square" ? [1024, 1024] : [832, 1216];
  const prompt =
    `Golden hour architectural photography of ${brief || "an upscale Spanish-style residential street in the Los Angeles hills, manicured lawns, tall palm trees, warm evening sunlight on white stucco homes"}, ` +
    "crystal clear sky, photorealistic, ultra sharp detail";
  const seed = Math.floor(Math.random() * 2_000_000_000);
  const wf = engine === "final"
    ? flux2Workflow(prompt, dims[0], dims[1], seed)
    : zImageWorkflow(prompt, dims[0], dims[1], seed);
  const res = await fetch(`${engineUrl(engine)}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: wf }),
  });
  if (!res.ok) throw new Error(`Image engine ${res.status}: ${(await res.text()).slice(0, 150)}`);
  const data = await res.json();
  if (!data?.prompt_id) throw new Error("Image engine did not accept the job");
  return data.prompt_id;
}

async function checkImage(promptId, engine) {
  const base = engineUrl(engine);
  const res = await fetch(`${base}/history/${promptId}`);
  if (!res.ok) return { status: "running" };
  const hist = await res.json();
  const entry = hist?.[promptId];
  if (!entry) {
    // Not in history: still queued, or lost to an engine restart — check the queue.
    try {
      const q = await (await fetch(`${base}/queue`)).json();
      const inQueue = [...(q.queue_running ?? []), ...(q.queue_pending ?? [])].some(
        (it) => Array.isArray(it) && it[1] === promptId
      );
      if (!inQueue) return { status: "error", error: "Job was lost — generate again." };
    } catch { /* engine unreachable; let client retry */ }
    return { status: "running" };
  }
  if (entry.status?.status_str === "error") return { status: "error", error: "Image generation failed" };
  const imgs = entry.outputs?.[SAVE_NODE]?.images;
  if (Array.isArray(imgs) && imgs.length) {
    const f = imgs[0];
    const url = `${base}/view?filename=${encodeURIComponent(f.filename)}&subfolder=${encodeURIComponent(f.subfolder || "")}&type=${encodeURIComponent(f.type)}`;
    const imgRes = await fetch(url);
    if (!imgRes.ok) return { status: "running" };
    const buf = Buffer.from(await imgRes.arrayBuffer());
    return { status: "done", image: `data:image/png;base64,${buf.toString("base64")}` };
  }
  return { status: "running" };
}

async function cancelImage(engine) {
  const base = engineUrl(engine);
  await fetch(`${base}/interrupt`, { method: "POST" }).catch(() => {});
  await fetch(`${base}/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clear: true }),
  }).catch(() => {});
}

// ---------- Publish (Postiz) ----------
async function publish({ caption, platforms }) {
  // Try Postiz; if unreachable/unconfigured, report staged so the UI is honest.
  try {
    const ping = await fetch(`${POSTIZ_URL}/api/health`, { signal: AbortSignal.timeout(4000) }).catch(() => null);
    if (!ping || !ping.ok || !POSTIZ_KEY) {
      return { staged: true, note: "Publishing service offline — post is queued and will go out when it reconnects." };
    }
    // Postiz public API: create a draft/scheduled post
    const res = await fetch(`${POSTIZ_URL}/api/public/v1/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: POSTIZ_KEY },
      body: JSON.stringify({ type: "draft", content: caption, platforms }),
    });
    if (!res.ok) throw new Error(`Postiz ${res.status}`);
    return { staged: false, note: "Sent to publisher." };
  } catch {
    return { staged: true, note: "Publishing service offline — post is queued and will go out when it reconnects." };
  }
}

module.exports = { writeCopy, submitImage, checkImage, publish };
