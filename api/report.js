// Performance report — aggregates leads, SEO rank, posts & ads by period so
// Steve/Anita can see what's working and pivot. GET ?period=day|week|month

const fs = require("fs");
const path = require("path");
const DIR = path.join(__dirname, "..", "data");
function read(f) { try { return JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")); } catch { return null; } }

function since(period) {
  const now = Date.now();
  const day = 864e5;
  if (period === "day") return now - day;
  if (period === "month") return now - 30 * day;
  return now - 7 * day; // week default
}

module.exports = async (req, res) => {
  try {
    const period = ((req.query || {}).period) || "week";
    const cutoff = since(period);

    // ---- Leads ----
    const leads = read("leads.json") || [];
    const inPeriod = leads.filter((l) => new Date(l.at).getTime() >= cutoff);
    const bySource = {};
    inPeriod.forEach((l) => { bySource[l.source || "unknown"] = (bySource[l.source || "unknown"] || 0) + 1; });
    const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0];

    // ---- SEO rank movement ----
    const rank = read("rank.json") || { history: [] };
    let rankMoves = [];
    if (rank.latest) {
      const now = new Date(rank.latest.at).getTime();
      let prev = null;
      for (let i = (rank.history || []).length - 1; i >= 0; i--) {
        if (now - new Date(rank.history[i].at).getTime() >= 6 * 864e5) { prev = rank.history[i]; break; }
      }
      const pmap = {}; if (prev) prev.positions.forEach((p) => (pmap[p.k] = p.p));
      rankMoves = rank.latest.rows.map((r) => ({ keyword: r.keyword, now: r.position, was: pmap[r.keyword] ?? null }));
    }
    const improving = rankMoves.filter((r) => r.now && r.was && r.now < r.was).length;
    const declining = rankMoves.filter((r) => r.now && r.was && r.now > r.was).length;

    // ---- Posts & ads ----
    const drafts = read("drafts.json") || [];
    const agentPosts = drafts.filter((d) => String(d.id).startsWith("agent_")).length;
    const ads = (read("ads.json") || {}).ads || [];
    const adsInPeriod = ads.filter((a) => new Date(a.at).getTime() >= cutoff).length;

    // ---- Pivot recommendation ----
    const recs = [];
    if (topSource) recs.push(`Your best lead source is "${topSource[0]}" (${topSource[1]} lead${topSource[1] > 1 ? "s" : ""}). Put more budget there.`);
    else recs.push("No leads captured yet this period — push the landing page in your posts and ads.");
    if (declining > improving) recs.push("More keywords slipped than climbed — refresh the blog and keep NAP consistent.");
    else if (improving > 0) recs.push(`${improving} keyword${improving > 1 ? "s are" : " is"} climbing — keep the current content cadence.`);

    res.status(200).json({
      period,
      leads: { total: inPeriod.length, allTime: leads.length, bySource },
      seo: { moves: rankMoves, improving, declining },
      content: { agentPosts, adsGenerated: adsInPeriod },
      recommendations: recs,
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
