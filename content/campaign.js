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
