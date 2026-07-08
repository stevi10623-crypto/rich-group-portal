// Social accounts + auto-post settings. When auto-post is ON, approved posts are
// scheduled and published (via Postiz) on the chosen cadence/time/platforms.
// GET  -> { settings, scheduled }
// POST { action:"settings", settings }   -> save
// POST { action:"schedule", post }       -> queue an approved post for auto-posting
// POST { action:"connect", platform, on } -> mark a platform connected

const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "data", "social.json");
const POSTIZ_URL = process.env.POSTIZ_URL || "http://192.168.1.30:4007";
const POSTIZ_KEY = process.env.POSTIZ_API_KEY || "";

const DEFAULT = {
  settings: {
    connected: { facebook: false, instagram: false, google: false, tiktok: false },
    autoPost: false,
    perWeek: 3,
    timeOfDay: "09:00",
    platforms: ["facebook", "instagram"],
  },
  scheduled: [],
};

function load() { try { return { ...DEFAULT, ...JSON.parse(fs.readFileSync(FILE, "utf8")) }; } catch { return JSON.parse(JSON.stringify(DEFAULT)); } }
function store(o) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o, null, 2)); }

// naive next-slot picker: spread perWeek posts across the week at timeOfDay
function nextSlot(s, existingCount) {
  const [h, m] = (s.timeOfDay || "09:00").split(":").map(Number);
  const gapDays = Math.max(1, Math.round(7 / Math.max(1, s.perWeek)));
  const d = new Date();
  d.setDate(d.getDate() + gapDays * (existingCount + 1));
  d.setHours(h || 9, m || 0, 0, 0);
  return d.toISOString();
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") return res.status(200).json(load());
    const b = req.body || {};
    const cur = load();

    if (b.action === "settings") { cur.settings = { ...cur.settings, ...b.settings }; store(cur); return res.status(200).json({ ok: true, settings: cur.settings }); }
    if (b.action === "connect") { cur.settings.connected[b.platform] = !!b.on; store(cur); return res.status(200).json({ ok: true, settings: cur.settings }); }
    if (b.action === "schedule") {
      const when = nextSlot(cur.settings, cur.scheduled.length);
      const item = { id: "sch_" + Date.now(), at: when, platforms: cur.settings.platforms, body: (b.post || {}).body || "", status: "scheduled" };
      cur.scheduled.unshift(item); store(cur);
      // best-effort immediate hand-off to Postiz if reachable
      if (POSTIZ_KEY) {
        fetch(`${POSTIZ_URL}/api/public/v1/posts`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: POSTIZ_KEY }, body: JSON.stringify({ type: "scheduled", date: when, content: item.body, platforms: item.platforms }), signal: AbortSignal.timeout(6000) }).catch(() => {});
      }
      return res.status(200).json({ ok: true, scheduledFor: when });
    }
    res.status(400).json({ error: "unknown action" });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
};
