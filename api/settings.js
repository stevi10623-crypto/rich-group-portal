// Real, editable tenant settings + a real password gate for the portal UI.
// GET                                  -> { business, hasPassword }  (never returns the password)
// POST { action:"login", password }    -> { ok }
// POST { action:"set-password", current, next } -> { ok } (validates current)
// POST { action:"save-business", business } -> { ok, business }
//
// NOTE: this gates the UI login screen. It is not full API auth (see project notes) —
// it's a real, changeable password for the front door, stored server-side.

const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "data", "settings.json");

const DEFAULT = {
  password: "demo1234", // changeable in Settings
  business: {
    name: "The Rich Group",
    contact: "Anita Rich",
    address: "12711 Ventura Blvd #110, Studio City, CA 91604",
    phone: "(818) 632-2258",
    email: "",
    website: "https://therichgroup.la",
    markets: "Sherman Oaks, Studio City, Valley Village, Encino",
    voice: "Warm, expert, 30+ years, no hype",
  },
};

function load() { try { return { ...DEFAULT, ...JSON.parse(fs.readFileSync(FILE, "utf8")) }; } catch { return JSON.parse(JSON.stringify(DEFAULT)); } }
function store(o) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o, null, 2)); }

module.exports = async (req, res) => {
  try {
    const cur = load();
    if (req.method === "GET") {
      return res.status(200).json({ business: cur.business, hasPassword: !!cur.password });
    }
    const b = req.body || {};
    if (b.action === "login") {
      return res.status(200).json({ ok: String(b.password || "") === String(cur.password || "") });
    }
    if (b.action === "set-password") {
      if (String(b.current || "") !== String(cur.password || "")) return res.status(200).json({ ok: false, error: "Current password is wrong." });
      if (!b.next || String(b.next).length < 4) return res.status(200).json({ ok: false, error: "New password must be at least 4 characters." });
      cur.password = String(b.next); store(cur);
      return res.status(200).json({ ok: true });
    }
    if (b.action === "save-business") {
      cur.business = { ...cur.business, ...(b.business || {}) }; store(cur);
      return res.status(200).json({ ok: true, business: cur.business });
    }
    res.status(400).json({ error: "unknown action" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
