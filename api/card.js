// Digital business cards — editable, multi-card, with photo + logo.
// GET            -> { cards: [...] }
// GET ?slug=x    -> the card (for the public /c page)
// POST { card }  -> create/update by slug (slug derived from name if new)
// DELETE ?slug=  -> remove

const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "data", "cards.json");

const SEED = [{
  slug: "anita-rich",
  name: "Anita Rich",
  titleLines: ["Founder & CEO, The Rich Group", "Broker, CRS · Luxury Estates Director"],
  company: "The Rich Group",
  brandColor: "#8f2129",
  photoUrl: "",
  logoUrl: "",
  phones: ["(818) 632-2258"],
  email: "",
  website: "https://therichgroup.la",
  address: "12711 Ventura Blvd #110, Studio City, CA 91604",
  brokerageLine: "Keller Williams · CA DRE# 00782527",
  socials: [
    { type: "instagram", url: "https://instagram.com/therichgroup" },
    { type: "facebook", url: "https://facebook.com/TheRichGroup.LA" },
    { type: "linkedin", url: "https://linkedin.com/in/anitarich" },
    { type: "x", url: "https://x.com/richwithresults" },
    { type: "youtube", url: "https://youtube.com/user/lifewithrich" },
  ],
}];

function load() { try { const d = JSON.parse(fs.readFileSync(FILE, "utf8")); return Array.isArray(d) && d.length ? d : SEED; } catch { return SEED; } }
function store(list) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(list, null, 2)); }
function slugify(s) { return String(s || "card").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "card"; }

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const slug = (req.query || {}).slug;
      if (slug) { const c = load().find((x) => x.slug === slug); return c ? res.status(200).json(c) : res.status(404).json({ error: "not found" }); }
      return res.status(200).json({ cards: load() });
    }
    if (req.method === "POST") {
      const card = (req.body || {}).card || req.body;
      if (!card || !card.name) return res.status(400).json({ error: "name required" });
      const list = load();
      const slug = card.slug || slugify(card.name);
      const rec = { ...card, slug };
      const i = list.findIndex((x) => x.slug === slug);
      if (i >= 0) list[i] = rec; else list.push(rec);
      store(list);
      return res.status(200).json({ ok: true, slug });
    }
    if (req.method === "DELETE") {
      const slug = (req.query || {}).slug;
      store(load().filter((x) => x.slug !== slug));
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: "unsupported method" });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
};
