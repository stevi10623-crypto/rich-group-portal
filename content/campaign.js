// The Rich Group — real campaign content (from the SEO audit + Content Pack, June 23 2026).
// This is the portal's data source: queue drafts, NAP record, checklist, GBP posts, metas, FAQ.
// Loaded by index.html via <script src="/content/campaign.js">.

window.CAMPAIGN = {
  nap: {
    name: "The Rich Group",
    address: "12711 Ventura Blvd #110, Studio City, CA 91604",
    phone: "(818) 632-2258",
    website: "https://therichgroup.la",
    dre: "00782527",
    note: "Retire the old Sherman Oaks address (14140 Ventura Blvd) and the secondary number everywhere.",
  },

  checklist: [
    { t: "Fix website footer call link → (818) 632-2258", who: "Anita (Luxury Presence)", done: false },
    { t: "Claim & verify the Google Business Profile", who: "Anita (Google login)", done: false },
    { t: "Update Google address to Studio City + set real hours", who: "Anita", done: false },
    { t: "Correct Yelp address to Studio City", who: "Anita", done: false },
    { t: "Verify Zillow, Realtor.com, Homes.com, Facebook, LinkedIn match NAP", who: "Anita", done: false },
    { t: "Send Google review requests to recent happy clients", who: "Anita (messages ready)", done: false },
  ],

  queue: [
    {
      id: "q1", tag: "t-blog", label: "Blog", publish: false,
      ttl: "Sherman Oaks Housing Market Update — 2026",
      when: "ready to publish",
      body:
"Title: Sherman Oaks Housing Market Update: What Buyers & Sellers Should Know in 2026\n" +
"Slug: sherman-oaks-housing-market-update-2026\n" +
"Meta: See where the Sherman Oaks housing market stands in 2026 — median prices, inventory, and what it means if you're buying or selling. Local insight from The Rich Group.\n\n" +
"If you own a home in Sherman Oaks — or you're hoping to buy one — the question on everyone's mind is the same: where is the market actually headed in 2026? After two years of low inventory and high interest rates, things are shifting. Here's a clear, no-spin look at where we stand and what it means for you.\n\n" +
"WHERE PRICES STAND RIGHT NOW\nAs of mid-2026, the median single-family home in Sherman Oaks is selling in the range of roughly $1.45M–$1.6M, with price per square foot up modestly — around 4–5% year over year. Condos are sitting near the $625K mark. [⚠ VERIFY against current MLS numbers before publishing]\n\n" +
"WHAT'S DIFFERENT FROM LAST YEAR\n• More choice for buyers — active listings have ticked up from the rock-bottom levels of 2024–2025.\n• Prices are holding, not crashing — well-located Sherman Oaks homes are stable to modestly up.\n• Well-prepared homes still move fast — turn-key, well-priced homes sell quickly, sometimes with multiple offers.\n\n" +
"IF YOU'RE THINKING ABOUT SELLING\nThis is still a strong window to sell, but preparation and pricing matter more than they have in years. The homes winning right now show beautifully and are priced to the real comps from day one.\n\n" +
"IF YOU'RE THINKING ABOUT BUYING\nYou have more leverage than a year ago — more inventory and slightly more room to negotiate. Be ready to move decisively when the right home appears.\n\n" +
"THE BOTTOM LINE\nSherman Oaks remains one of the most sought-after places to live in the Valley, and 2026 is shaping up to be a more balanced, healthier market. Curious what your home is worth? Get a free, no-obligation home valuation, or reach out to The Rich Group — we've helped Sherman Oaks families buy and sell for more than 30 years. (818) 632-2258",
    },
    {
      id: "q2", tag: "t-gbp", label: "Google Post", publish: true, platforms: ["gbp"],
      ttl: "GBP Post A — Market update",
      when: "ready",
      body: "The Sherman Oaks market is shifting in 2026 — more inventory for buyers and steady prices for sellers. Wondering what it means for your home? Read our latest market update or reach out for a free, personalized valuation. 📈",
    },
    {
      id: "q3", tag: "t-gbp", label: "Google Post", publish: true, platforms: ["gbp"],
      ttl: "GBP Post B — Just sold",
      when: "ready",
      body: "Just sold in [neighborhood]! Another happy family moved on to their next chapter. Thinking of selling? With 30+ years in Sherman Oaks & Studio City, The Rich Group knows how to get it done. Call (818) 632-2258. 🏡",
    },
    {
      id: "q4", tag: "t-review", label: "Review Request", publish: false,
      ttl: "Client review request — text message",
      when: "ready to send",
      body: "Hi [First Name]! It was such a pleasure helping you with [your home sale / your new home]. If you have a quick minute, a short Google review would mean the world and helps other local families find us. Here's the link: [GOOGLE REVIEW LINK]. Thank you! — Anita",
    },
    {
      id: "q5", tag: "t-review", label: "Review Request", publish: false,
      ttl: "Client review request — email",
      when: "ready to send",
      body: "Subject: A quick favor?\n\nHi [First Name],\n\nIt was truly a pleasure working with you on [your home sale / finding your new home]. Helping families like yours is the best part of what I do.\n\nIf you were happy with your experience, would you consider leaving a short Google review? It takes about a minute, and it genuinely helps other Sherman Oaks and Studio City families find someone they can trust.\n\nHere's the direct link: [GOOGLE REVIEW LINK]\n\nThank you so much — it means a great deal.\n\nWarmly,\nAnita Rich\nThe Rich Group | (818) 632-2258",
    },
  ],

  metas: [
    { page: "Home", title: "Sherman Oaks Real Estate Agent | The Rich Group", desc: "Buy or sell in Sherman Oaks & Studio City with The Rich Group — a top-rated team with 30+ years of local results. Get started today." },
    { page: "Sherman Oaks", title: "Sherman Oaks Homes for Sale | The Rich Group", desc: "Browse Sherman Oaks homes for sale and get expert local guidance from The Rich Group. Find your next home or get your home's value." },
    { page: "Studio City", title: "Studio City Homes for Sale | The Rich Group", desc: "Explore Studio City real estate with The Rich Group. Local experts helping buyers and sellers across the San Fernando Valley." },
    { page: "Valley Village", title: "Valley Village Homes & Condos | The Rich Group", desc: "See Valley Village homes and condos for sale. The Rich Group offers trusted, local real estate expertise — contact us today." },
    { page: "Home Valuation", title: "What's My Home Worth? | Sherman Oaks Home Value", desc: "Get a free, accurate home valuation for your Sherman Oaks or Studio City property from The Rich Group. No obligation." },
  ],

  blogIdeas: [
    "Studio City vs. Sherman Oaks: Which Neighborhood Is Right for You?",
    "How Much Is My Sherman Oaks Home Worth in 2026?",
    "The 7 Best Family-Friendly Streets & Pockets in Studio City",
    "Selling a Home in the San Fernando Valley: A 2026 Step-by-Step Guide",
    "First-Time Buyer's Guide to Valley Village Condos",
  ],
};

window.CAMPAIGN.priorities = [
  { n: 1, t: "Google Business Profile + reviews", when: "this week", why: "Highest-ROI channel for a local agent — drives more calls than everything else combined. Free.", steps: "Claim/verify profile → complete 100% (ONE address, ONE phone, hours, service areas, categories, 10+ photos) → review push (2-4/month drip) → post 1-2x/month." },
  { n: 2, t: "Fix business info (NAP) everywhere", when: "this week", why: "Google & AI assistants lower rankings when they can't confirm one consistent identity. Yelp still shows the old Sherman Oaks address; the footer click-to-call dials the wrong number.", steps: "Make every listing match the official record exactly (see NAP checklist below)." },
  { n: 3, t: "Revive the blog with local content", when: "ongoing — 2 posts/month", why: "Newest post is May 2023. Fresh local market content is the strongest organic lever a realtor has.", steps: "One local keyword per post. Post #1 is written and in the Approval Queue." },
  { n: 4, t: "On-page tune-ups", when: "a few hours, once", why: "Each key page should rank for its city + service.", steps: "Apply the titles & metas below in Luxury Presence; one clear H1 per page; alt text on photos; add the FAQ block." },
  { n: 5, t: "AI-search readiness", when: "built into the above", why: "ChatGPT/Gemini/Perplexity cite well-reviewed, consistently-listed agents with clear Q&A content.", steps: "FAQ block + reviews + consistent listings; confirm robots.txt isn't blocking AI crawlers." },
  { n: 6, t: "Local links & citations", when: "slow burn", why: "Authority signals.", steps: "Local directories, chamber, quotes to local outlets, partner links (stagers, lenders, escrow); keep the vlog active." },
];

window.CAMPAIGN.listingsAudit = [
  { site: "Website footer", now: "Studio City address ✓, but click-to-call dials the WRONG number", action: "Fix footer phone link in Luxury Presence → (818) 632-2258" },
  { site: "Google Business Profile", now: "\"The Rich Group | Compass\" — OLD Sherman Oaks address, \"Open 24 hours\", UNCLAIMED", action: "CLAIM IT, then set Studio City address + real hours" },
  { site: "Yelp", now: "14140 Ventura Blvd, Sherman Oaks (old address)", action: "Update address & phone to Studio City office" },
  { site: "Zillow", now: "Listed under Studio City", action: "Verify exact street address & phone match" },
  { site: "Realtor.com", now: "Listed under Studio City 91604", action: "Verify address & phone match" },
  { site: "Homes.com", now: "Profile exists", action: "Verify address & phone match" },
  { site: "Bing Places / Apple Maps", now: "Unverified", action: "Claim/verify and set to official record" },
  { site: "Facebook / LinkedIn", now: "Check About/contact info", action: "Update address & phone to match" },
];

window.CAMPAIGN.gbpSteps = [
  "Search \"The Rich Group Compass\" on Google → business panel → \"Own this business?\" / \"Claim this business\"",
  "Sign in with the business Google account; complete verification (phone, video, or postcard)",
  "Update address to 12711 Ventura Blvd #110, Studio City, CA 91604",
  "Set real business hours (replace \"Open 24 hours\")",
  "Confirm category (Real Estate Agent), add service areas, website link, and 10+ photos",
  "Start the review push using the messages in the Approval Queue — steady few per month",
];

window.CAMPAIGN.bigFinding = "The Google profile has only 5 reviews — but Anita has 28 on Zillow and 15 on Yelp. Claiming it and funneling reviews to Google is the single biggest free win available.";

window.CAMPAIGN.faq = [
  { q: "What areas does The Rich Group serve?", a: "The Rich Group specializes in Sherman Oaks, Studio City, and Valley Village, and serves the greater San Fernando Valley and LA's Westside — including Encino, Tarzana, Woodland Hills, Toluca Lake, Beverly Hills, and the Hollywood Hills." },
  { q: "How experienced is The Rich Group?", a: "Led by Anita Rich, The Rich Group has more than 30 years of experience and ranks among the top 3% of agents nationwide, with a long track record of successful sales across the Valley and Westside." },
  { q: "How do I find out what my home is worth?", a: "You can request a free, no-obligation home valuation through our website, or contact us directly for a personalized market analysis based on current local sales." },
  { q: "Is 2026 a good time to buy or sell in Sherman Oaks?", a: "Both buyers and sellers have opportunities in 2026. Inventory has improved for buyers, while prices remain steady for sellers. The right move depends on your home, timeline, and goals." },
  { q: "How do I get in touch with The Rich Group?", a: "Call us at (818) 632-2258 or use the contact form on our website." },
];
