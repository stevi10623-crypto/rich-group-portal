// Lead capture from the ad landing page. POST { name, phone, address, source }
// GET -> { leads: [...], countThisMonth } for the dashboard.

const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "data", "leads.json");
const WEBHOOK = process.env.REQUEST_WEBHOOK || "";

function load() { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return []; } }
function store(l) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(l, null, 2)); }

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const leads = load();
      const now = new Date();
      const countThisMonth = leads.filter((l) => {
        const d = new Date(l.at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length;
      return res.status(200).json({ leads, countThisMonth });
    }
    if (req.method === "POST" && (req.body || {}).action === "status") {
      const { id, status } = req.body;
      store(load().map((l) => (l.id === id ? { ...l, status } : l)));
      return res.status(200).json({ ok: true });
    }
    if (req.method === "POST") {
      const { name, phone, address, source } = req.body || {};
      if (!name || !phone) return res.status(400).json({ error: "name and phone required" });
      const lead = { id: "lead_" + Date.now() + "_" + Math.floor(Math.random()*1e6), at: new Date().toISOString(), name, phone, address: address || "", source: source || "landing-page", status: "new" };
      const leads = load(); leads.unshift(lead); store(leads.slice(0, 2000));
      if (WEBHOOK) fetch(WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: `🔔 New lead: ${name} · ${phone} · ${address || ""}` }), signal: AbortSignal.timeout(5000) }).catch(() => {});
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: "unsupported method" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
