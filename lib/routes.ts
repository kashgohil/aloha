// Single source of truth for every marketing URL.
// Footer + nav read from this. When a page doesn't exist yet, the route
// still appears here — it will 404 until the page lands in its phase.
//
// In-app (post-auth) routes live under /app/* and are not listed here.

export const routes = {
  home: "/",
  signin: "/auth/signin",

  // Phase 1 — Product features (top-level URLs)
  product: {
    composer: "/composer",
    calendar: "/calendar",
    analytics: "/analytics",
    logicMatrix: "/logic-matrix",
    inbox: "/inbox",
    linkInBio: "/link-in-bio",
    mobile: "/mobile",
    whatsNew: "/whats-new",
  },

  // Phase 2 — Channels
  channels: {
    instagram: "/channels/instagram",
    linkedin: "/channels/linkedin",
    x: "/channels/x",
    tiktok: "/channels/tiktok",
    threads: "/channels/threads",
    facebook: "/channels/facebook",
    pinterest: "/channels/pinterest",
    youtube: "/channels/youtube",
  },

  // Phase 3 — Compare + positioning
  compare: {
    buffer: "/compare/buffer",
    hootsuite: "/compare/hootsuite",
    later: "/compare/later",
    sproutSocial: "/compare/sprout-social",
    kit: "/compare/kit",
    typefully: "/compare/typefully",
    migrationGuide: "/migrate",
    whyDifferent: "/why-were-different",
  },

  // Phase 4 — For / personas
  for: {
    solopreneurs: "/for/solopreneurs",
    creators: "/for/creators",
    smallBusiness: "/for/small-business",
    agencies: "/for/agencies",
    teams: "/for/teams",
    nonprofits: "/for/nonprofits",
  },

  // Phase 5 — Resources
  resources: {
    index: "/resources",
    fieldNotes: "/resources/field-notes",
    playbooks: "/resources/playbooks",
    templates: "/resources/templates",
    creatorGuides: "/resources/creator-guides",
    helpCenter: "/help",
    apiDocs: "/docs",
    status: "/status",
    changelog: "/changelog",
  },

  // Phase 6 — Company
  company: {
    about: "/about",
    manifesto: "/manifesto",
    careers: "/careers",
    press: "/press",
    brand: "/brand",
    contact: "/contact",
  },

  // Phase 7 — Customers
  customers: {
    caseStudies: "/customers",
    creatorSpotlight: "/customers/spotlight",
    community: "/community",
    events: "/events",
  },

  // Phase 8 — Free tools
  tools: {
    bioGenerator: "/tools/bio-generator",
    bestTimeFinder: "/tools/best-time-finder",
    hashtagDecoder: "/tools/hashtag-decoder",
    postCritic: "/tools/post-critic",
    captionScrubber: "/tools/caption-scrubber",
  },

  // Phase 9 — Legal
  legal: {
    privacy: "/legal/privacy",
    terms: "/legal/terms",
    cookies: "/legal/cookies",
    dpa: "/legal/dpa",
    security: "/legal/security",
    responsibleAi: "/legal/responsible-ai",
  },

  // Phase 10 — Connect
  connect: {
    newsletter: "/newsletter",
    podcast: "/podcast",
    slack: "/community/slack",
    affiliate: "/affiliate",
    partners: "/partners",
  },

  // Phase 11 — Trust
  trust: "/trust",

  // Utility
  misc: {
    sitemap: "/sitemap",
    accessibility: "/accessibility",
    doNotSell: "/legal/do-not-sell",
    appStore: "#", // external, filled later
    googlePlay: "#", // external, filled later
  },
} as const;

// Grouped link lists consumed by the footer. Label + href pairs, in render order.
export const footerLinks = {
  primary: [
    {
      heading: "Product",
      links: [
        { label: "Composer", href: routes.product.composer },
        { label: "Calendar", href: routes.product.calendar },
        { label: "Analytics", href: routes.product.analytics },
        { label: "Logic Matrix", href: routes.product.logicMatrix },
        { label: "Inbox", href: routes.product.inbox },
        { label: "Link-in-bio", href: routes.product.linkInBio },
        { label: "Mobile app", href: routes.product.mobile },
        { label: "What's new", href: routes.product.whatsNew },
      ],
    },
    {
      heading: "Channels",
      links: [
        { label: "Instagram", href: routes.channels.instagram },
        { label: "LinkedIn", href: routes.channels.linkedin },
        { label: "X", href: routes.channels.x },
        { label: "TikTok", href: routes.channels.tiktok },
        { label: "Threads", href: routes.channels.threads },
        { label: "Facebook", href: routes.channels.facebook },
        { label: "Pinterest", href: routes.channels.pinterest },
        { label: "YouTube", href: routes.channels.youtube },
      ],
    },
    {
      heading: "Compare",
      links: [
        { label: "vs Buffer", href: routes.compare.buffer },
        { label: "vs Hootsuite", href: routes.compare.hootsuite },
        { label: "vs Later", href: routes.compare.later },
        { label: "vs Sprout Social", href: routes.compare.sproutSocial },
        { label: "vs Kit", href: routes.compare.kit },
        { label: "vs Typefully", href: routes.compare.typefully },
        { label: "Migration guide", href: routes.compare.migrationGuide },
        { label: "Why we're different", href: routes.compare.whyDifferent },
      ],
    },
    {
      heading: "Resources",
      links: [
        { label: "Field notes", href: routes.resources.fieldNotes },
        { label: "Playbooks", href: routes.resources.playbooks },
        { label: "Templates", href: routes.resources.templates },
        { label: "Creator guides", href: routes.resources.creatorGuides },
        { label: "Help center", href: routes.resources.helpCenter },
        { label: "API docs", href: routes.resources.apiDocs },
        { label: "Status", href: routes.resources.status },
        { label: "Changelog", href: routes.resources.changelog },
      ],
    },
  ],
  secondary: [
    {
      heading: "For",
      links: [
        { label: "Solopreneurs", href: routes.for.solopreneurs },
        { label: "Creators", href: routes.for.creators },
        { label: "Small business", href: routes.for.smallBusiness },
        { label: "Agencies", href: routes.for.agencies },
        { label: "Teams", href: routes.for.teams },
        { label: "Nonprofits", href: routes.for.nonprofits },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About", href: routes.company.about },
        { label: "Manifesto", href: routes.company.manifesto },
        { label: "Careers", href: routes.company.careers },
        { label: "Press kit", href: routes.company.press },
        { label: "Brand", href: routes.company.brand },
        { label: "Contact", href: routes.company.contact },
      ],
    },
    {
      heading: "Customers",
      links: [
        { label: "Case studies", href: routes.customers.caseStudies },
        { label: "Creator spotlight", href: routes.customers.creatorSpotlight },
        { label: "Community", href: routes.customers.community },
        { label: "Events", href: routes.customers.events },
      ],
    },
    {
      heading: "Free tools",
      links: [
        { label: "Bio generator", href: routes.tools.bioGenerator },
        { label: "Best-time finder", href: routes.tools.bestTimeFinder },
        { label: "Hashtag decoder", href: routes.tools.hashtagDecoder },
        { label: "Post critic", href: routes.tools.postCritic },
        { label: "Caption scrubber", href: routes.tools.captionScrubber },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy", href: routes.legal.privacy },
        { label: "Terms", href: routes.legal.terms },
        { label: "Cookies", href: routes.legal.cookies },
        { label: "DPA", href: routes.legal.dpa },
        { label: "Security", href: routes.legal.security },
        { label: "Responsible AI", href: routes.legal.responsibleAi },
      ],
    },
    {
      heading: "Connect",
      links: [
        { label: "Newsletter", href: routes.connect.newsletter },
        { label: "Podcast", href: routes.connect.podcast },
        { label: "Community Slack", href: routes.connect.slack },
        { label: "Affiliate", href: routes.connect.affiliate },
        { label: "Partners", href: routes.connect.partners },
      ],
    },
  ],
  bottom: [
    { label: "Sitemap", href: routes.misc.sitemap },
    { label: "Accessibility", href: routes.misc.accessibility },
    { label: "Do not sell", href: routes.misc.doNotSell },
  ],
} as const;

// Top-nav items (section anchors on the landing page; real routes elsewhere).
export const navItems = [
  { label: "Product", href: "#product" },
  { label: "Channels", href: "#channels" },
  { label: "Stories", href: "#stories" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: routes.resources.index },
] as const;
