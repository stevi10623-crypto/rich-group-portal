// Anita's requests to Steve's Dev & Data — "please add/update/change X".
// POST { category, message }  -> stores it, optionally pings a webhook
// GET                         -> { requests: [...] } (admin view for Steve)

const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "data", "requests.json");
const WEBHOOK = process.env.REQUEST_WEBHOOK || ""; // optional: Telegram/Slack/etc. URL

function load() { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return []; } }
function store(list) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") return res.status(200).json({ requests: load() });
    if (req.method === "POST") {
      const { category, message } = req.body || {};
      if (!message) return res.status(400).json({ error: "message required" });
      const entry = {
        id: "req_" + load().length + "_" + message.slice(0, 8).replace(/\W/g, ""),
        at: new Date().toISOString(),
        agent: "The Rich Group — Anita Rich",
        category: category || "General",
        message,
        status: "new",
      };
      const list = load(); list.unshift(entry); store(list.slice(0, 500));
      // best-effort notify Steve — never blocks the user if it fails
      if (WEBHOOK) {
        fetch(WEBHOOK, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: `New portal request from Anita [${entry.category}]: ${message}` }),
          signal: AbortSignal.timeout(5000),
        }).catch(() => {});
      }
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: "unsupported method" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
