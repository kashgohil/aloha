// Persona marketing data — powers /for/[persona].
//
// Every entry reinforces the merged /pricing plans section by carrying a
// `recommendedPlan` pointer; the persona page previews the right card and
// then hands off to /pricing rather than duplicating the plan content.

export type PlanSlug = "solo" | "team" | "agency" | "nonprofit";

export type Persona = {
  slug: string;
  // Display name: "Solopreneurs", "Creators", etc.
  name: string;
  // One-line positioning above the hero.
  tagline: string;
  // Eyebrow shown in the hero ("For solo operators").
  eyebrow: string;
  // Two-line headline.
  headline: { line1: string; line2: string };
  // Subcopy under the headline.
  lead: string;
  // Palette accent for the hero visual.
  accent: "bg-peach-100" | "bg-peach-200" | "bg-peach-300" | "bg-peach-400" | "bg-primary-soft";
  // Three pain → resolution pairings. These structure the main feature block.
  pains: { pain: string; resolution: string; feature: string; href: string }[];
  // Typical day rhythm — 5 time-stamped actions shown in a left-spine timeline.
  day: { time: string; label: string; tone: string }[];
  // Which plan this persona lands on.
  recommendedPlan: { slug: PlanSlug; name: string; priceLabel: string; why: string };
  // Channels most of this persona lives on (slugs from lib/channels.ts).
  channels: string[];
  // Three product surfaces that matter most — label + why + route.
  topFeatures: { name: string; why: string; href: string }[];
  // One quote from someone in this persona.
  testimonial: { q: string; n: string; r: string; ini: string };
  // Two-line closing CTA.
  cta: { line1: string; line2: string };
  // Hero placeholder photo brief — saved with the page so future editors
  // know what image to drop in.
  heroPhotoNotes: string;
};

export const PERSONAS: Record<string, Persona> = {
  solopreneurs: {
    slug: "solopreneurs",
    name: "Solopreneurs",
    tagline: "One person. Every channel. Still time to make.",
    eyebrow: "For the one-person shop",
    headline: {
      line1: "Content is priority",
      line2: "number fifteen.",
    },
    lead:
      "You're the writer, the designer, the finance department, and the client. Aloha gives you back the four-hour Wednesday that social scheduling steals — a weekly trio across the three channels that move your business, auto-drafted in your voice.",
    accent: "bg-peach-100",
    pains: [
      {
        pain: "You don't have a second set of eyes",
        resolution:
          "The Composer is your editor. Voice-match score tells you when the hook isn't doing its job; rewrites suggest tighter ones.",
        feature: "Composer",
        href: "/composer",
      },
      {
        pain: "The Sunday-night panic shouldn't be a line item",
        resolution:
          "Calendar ghost-slots show where the week expects content. A template fills them in twelve minutes, not three hours.",
        feature: "Calendar",
        href: "/calendar",
      },
      {
        pain: "You're paying for tools that assume you have a team",
        resolution:
          "The free plan covers three channels forever, no card. You only pay when the business is ready — and then you pay $16, not $249.",
        feature: "Pricing",
        href: "/pricing",
      },
    ],
    day: [
      { time: "07:10", label: "coffee, re-read the week's queue", tone: "bg-peach-100" },
      { time: "09:30", label: "one LinkedIn post ships", tone: "bg-primary-soft" },
      { time: "12:45", label: "client work (not your problem, Aloha)", tone: "bg-muted" },
      { time: "16:00", label: "an X thread drafts itself from a field note", tone: "bg-peach-200" },
      { time: "21:00", label: "inbox triage · 4 replies, then closed", tone: "bg-peach-300" },
    ],
    recommendedPlan: {
      slug: "solo",
      name: "Solo creator",
      priceLabel: "Free forever",
      why:
        "Three channels, ten posts per channel per month, no card. Upgrades are optional — most solopreneurs never need to.",
    },
    channels: ["linkedin", "x", "instagram"],
    topFeatures: [
      { name: "Composer voice model", why: "Drafts in your cadence, not a template", href: "/composer" },
      { name: "Calendar with cadence", why: "Fills the week before you open the laptop", href: "/calendar" },
      { name: "Free forever plan", why: "Three channels. Ten posts a month. Zero card.", href: "/pricing" },
    ],
    testimonial: {
      q: "I stopped dreading Mondays. That sounds small, but Mondays were when the week's posting panic began. Aloha made my Mondays quiet.",
      n: "Naledi O.",
      r: "Founder, Braid Studio · solo",
      ini: "N",
    },
    cta: { line1: "Ship the work.", line2: "Not the schedule." },
    heroPhotoNotes:
      "Editorial portrait of a solo operator at a warm-light desk, morning coffee, laptop open to a calendar view. Warm cream tones, shallow depth of field. 4:5 vertical preferred. Real person, not stock smile — the feel is focused, not performative.",
  },

  creators: {
    slug: "creators",
    name: "Creators",
    tagline: "Voice is the product.",
    eyebrow: "For creators",
    headline: {
      line1: "Platforms change.",
      line2: "Your voice shouldn't.",
    },
    lead:
      "The channels you're on this year won't be the ones that matter in two. The one constant is how you write. Aloha models your voice from your best work and carries it across whatever the algorithm surfaces next.",
    accent: "bg-peach-200",
    pains: [
      {
        pain: "The same post, five ways, three hours",
        resolution:
          "One draft, native rewrites per channel — Composer does the re-paging, you approve before it ships.",
        feature: "Composer",
        href: "/composer",
      },
      {
        pain: "Shipping is one thing; landing is another",
        resolution:
          "Analytics that names the three posts that carried the lift, and whether the pattern is repeatable or a one-off.",
        feature: "Analytics",
        href: "/analytics",
      },
      {
        pain: "Your first reply to a new follower shouldn't be a job",
        resolution:
          "Logic Matrix drafts a warm first-touch DM when someone engages; you approve before it sends. Never auto-spam.",
        feature: "Logic Matrix",
        href: "/logic-matrix",
      },
    ],
    day: [
      { time: "06:45", label: "morning pages → Monday field note", tone: "bg-peach-100" },
      { time: "09:00", label: "Composer drafts per-channel rewrites", tone: "bg-peach-200" },
      { time: "10:30", label: "deep work block (Aloha is silent)", tone: "bg-muted" },
      { time: "14:00", label: "record the TikTok; Shorts + Reels auto-cross-post", tone: "bg-peach-400" },
      { time: "18:00", label: "inbox triage · reply to the three worth replying to", tone: "bg-primary-soft" },
    ],
    recommendedPlan: {
      slug: "solo",
      name: "Solo creator",
      priceLabel: "Free forever → $16 Pro when the list grows",
      why:
        "Start free; upgrade to Working team the month a second person joins, or the day 'unlimited scheduling' stops being a luxury.",
    },
    channels: ["instagram", "youtube", "tiktok", "threads"],
    topFeatures: [
      { name: "Voice model", why: "Stays yours across Instagram, Threads, X, YouTube", href: "/composer" },
      { name: "Per-channel rewrite", why: "Long for LinkedIn, sharp for X, soft for Instagram", href: "/channels/instagram" },
      { name: "Logic Matrix · welcome flow", why: "Warm first-touch DM, always approved", href: "/logic-matrix" },
    ],
    testimonial: {
      q: "The voice model writes in my cadence now. My editor can't always tell which drafts I wrote and which Aloha did — and she's been editing me for four years.",
      n: "Priya N.",
      r: "Ghostwriter · 38K on LinkedIn",
      ini: "P",
    },
    cta: { line1: "Keep the voice.", line2: "Let the rest move." },
    heroPhotoNotes:
      "Creator setup — messy-beautiful — phone on a ring light, notebook open, second screen on the side. Warm afternoon window light. 4:5 vertical. Hands visible, face optional. Feels lived-in, not staged.",
  },

  "small-business": {
    slug: "small-business",
    name: "Small business",
    tagline: "Your audience is local. Your tool doesn't need to be global.",
    eyebrow: "For small businesses",
    headline: {
      line1: "A neighborhood tool",
      line2: "for a neighborhood business.",
    },
    lead:
      "You're a bakery with 21,000 followers on Facebook, a coffee shop whose Instagram still works, a studio that needs the page to be replied to before 9pm. Aloha keeps the humanity in the posting — and the humans answering the DMs.",
    accent: "bg-peach-100",
    pains: [
      {
        pain: "Customers ask questions at 9pm",
        resolution:
          "Unified inbox captures every DM and comment across channels. Priority triage surfaces the real questions; praise gets a one-tap heart.",
        feature: "Inbox",
        href: "/inbox",
      },
      {
        pain: "The launch goes up, then life happens",
        resolution:
          "Logic Matrix templates cover the 7-post launch arc — teaser, drop, social proof, FAQ, last call — you only touch the drafts that matter.",
        feature: "Logic Matrix",
        href: "/logic-matrix",
      },
      {
        pain: "Five people, not fifty SKUs",
        resolution:
          "Working team plan is $16 total. Approvals, brand kits, and 5 seats. No enterprise pricing trap.",
        feature: "Pricing",
        href: "/pricing",
      },
    ],
    day: [
      { time: "07:00", label: "morning post · today's bake, on Facebook + Instagram", tone: "bg-peach-200" },
      { time: "10:30", label: "team approves the weekend special", tone: "bg-primary-soft" },
      { time: "13:00", label: "lunch rush (Aloha is silent)", tone: "bg-muted" },
      { time: "17:00", label: "inbox catch-up · two DMs answered, three auto-thanked", tone: "bg-peach-100" },
      { time: "20:30", label: "next-week queue filled in 15 minutes", tone: "bg-peach-300" },
    ],
    recommendedPlan: {
      slug: "team",
      name: "Working team",
      priceLabel: "$16 / month, all-in",
      why:
        "Five seats, eight channels, approvals and brand kits. Built for the team of three–five who need to move together.",
    },
    channels: ["facebook", "instagram", "pinterest"],
    topFeatures: [
      { name: "Inbox with triage", why: "Customer questions surface; praise gets handled in one tap", href: "/inbox" },
      { name: "Launch templates", why: "Seven-beat drop preloaded; customise in minutes", href: "/logic-matrix" },
      { name: "Team plan, not enterprise price", why: "$16 total for five people", href: "/pricing" },
    ],
    testimonial: {
      q: "Facebook's where half my customers live. Aloha's the only scheduler that still takes it seriously — and my staff actually uses the inbox.",
      n: "Marta R.",
      r: "Neighborhood bakery · 21K page",
      ini: "M",
    },
    cta: { line1: "Stay present.", line2: "For the people who stayed." },
    heroPhotoNotes:
      "Small business in its working element — counter view of a bakery at the morning rush, or a studio owner photographing product with a phone. Warm tones, real place, real hands. 4:5 vertical. Aim for 'intimate business', not 'corporate stock'.",
  },

  agencies: {
    slug: "agencies",
    name: "Agencies",
    tagline: "Many brands, one head.",
    eyebrow: "For agencies",
    headline: {
      line1: "Eight clients.",
      line2: "One calm afternoon.",
    },
    lead:
      "Managing six-to-fifty brands at once is a workflow problem first, a scheduling problem second. Aloha's workspace isolation, white-label reports, and per-client voice models let a two-person team run what used to need six.",
    accent: "bg-primary-soft",
    pains: [
      {
        pain: "Client silos are a nightmare in most tools",
        resolution:
          "True workspace isolation — separate voice models, separate calendars, separate billing, separate SSO domains.",
        feature: "Agency plan",
        href: "/pricing",
      },
      {
        pain: "White-label reports eat a day a month per client",
        resolution:
          "Branded PDF reports auto-generated from the client's analytics. Your logo, your color, no Aloha watermark.",
        feature: "Analytics",
        href: "/analytics",
      },
      {
        pain: "Onboarding a new client takes a week",
        resolution:
          "Template-driven setup. A new client goes from zero to scheduled in ~45 minutes via the migration guide.",
        feature: "Migration",
        href: "/migrate",
      },
    ],
    day: [
      { time: "08:00", label: "5-client dashboard skim · nothing urgent", tone: "bg-primary-soft" },
      { time: "10:00", label: "two client approvals, three declines", tone: "bg-peach-200" },
      { time: "13:30", label: "new-client onboarding workshop", tone: "bg-peach-300" },
      { time: "15:00", label: "monthly white-label PDFs auto-email clients", tone: "bg-peach-100" },
      { time: "17:30", label: "team retro · who did what, what changed", tone: "bg-muted" },
    ],
    recommendedPlan: {
      slug: "agency",
      name: "Agency",
      priceLabel: "$49 / month per workspace",
      why:
        "Unlimited client workspaces, white-label PDFs, SSO + SCIM, priority + Slack support. Volume discounts on 10+ workspaces.",
    },
    channels: ["instagram", "linkedin", "x", "facebook", "tiktok", "threads", "pinterest", "youtube"],
    topFeatures: [
      { name: "Workspace isolation", why: "Per-client voice, calendar, billing — never bleeds", href: "/pricing" },
      { name: "White-label PDFs", why: "Monthly client report auto-branded and sent", href: "/analytics" },
      { name: "Migration tools", why: "New-client onboarding in an afternoon", href: "/migrate" },
    ],
    testimonial: {
      q: "The automation matrix saved me 11 hours last month. I checked.",
      n: "Leah S.",
      r: "Agency owner · 6 clients",
      ini: "L",
    },
    cta: { line1: "More brands.", line2: "Less juggling." },
    heroPhotoNotes:
      "Agency scene — two people at a long table, multiple laptops, one showing a calendar, one showing client analytics. Warm overhead light, cluttered but clean. 16:10 horizontal preferred here. Feels 'studio', not 'open plan office'.",
  },

  teams: {
    slug: "teams",
    name: "Teams",
    tagline: "A content operation that scales without losing the voice.",
    eyebrow: "For in-house teams",
    headline: {
      line1: "Writers, editors,",
      line2: "a voice that's the same.",
    },
    lead:
      "Marketing teams, comms teams, content orgs. Aloha's per-brand voice model + approval workflows let a junior writer ship as confidently as the founder — and keep the tone right when the team rotates.",
    accent: "bg-primary-soft",
    pains: [
      {
        pain: "Writers wait on marketers. Marketers wait on legal. Nothing ships.",
        resolution:
          "Inline approvals, reviewer SLAs, and an audit log of every suggestion — comments live with the draft, not in a doc chain.",
        feature: "Approvals",
        href: "/composer",
      },
      {
        pain: "Losing the voice when someone new joins",
        resolution:
          "Voice model captures the house cadence. Onboarding writers read a briefing, the model does the rest.",
        feature: "Composer",
        href: "/composer",
      },
      {
        pain: "Attribution stops at the click",
        resolution:
          "Webhooks pipe engagement events into your warehouse. Exports in CSV, JSON, or a Notion-friendly digest.",
        feature: "Analytics exports",
        href: "/analytics",
      },
    ],
    day: [
      { time: "09:30", label: "edit queue · 4 drafts waiting", tone: "bg-primary-soft" },
      { time: "11:00", label: "stand-up: what did we learn last week (not 'what are we posting')", tone: "bg-peach-100" },
      { time: "14:00", label: "campaign launch · Matrix runs the 7-beat arc", tone: "bg-peach-200" },
      { time: "16:00", label: "analytics digest auto-emails stakeholders", tone: "bg-peach-300" },
      { time: "17:30", label: "weekly retro · what to repeat", tone: "bg-muted" },
    ],
    recommendedPlan: {
      slug: "team",
      name: "Working team",
      priceLabel: "$16 / month, all-in",
      why:
        "Five seats, eight channels, approval flows, brand kits. SSO available as an Enterprise add-on on 10+ seats.",
    },
    channels: ["linkedin", "x", "youtube"],
    topFeatures: [
      { name: "Approval workflows", why: "Every draft is reviewed, every review is logged", href: "/composer" },
      { name: "Per-brand voice models", why: "Your brand voice, captured and consistent", href: "/composer" },
      { name: "Analytics webhooks", why: "Pipe everything to your own warehouse", href: "/analytics" },
    ],
    testimonial: {
      q: "Our Monday stand-up used to be 'what are we posting this week.' Now it's 'what did we learn last week.'",
      n: "Maya R.",
      r: "Head of content · Fermi (8-person team)",
      ini: "M",
    },
    cta: { line1: "Ship more.", line2: "Stay consistent." },
    heroPhotoNotes:
      "In-house content team — three to four people around a screen reviewing a draft. Marketer-looking people, warm bright office, focused but relaxed. 16:10 horizontal. No headsets-and-whiteboards stock tropes.",
  },

  nonprofits: {
    slug: "nonprofits",
    name: "Nonprofits",
    tagline: "Mission first. Tool second.",
    eyebrow: "For nonprofits",
    headline: {
      line1: "Stories matter.",
      line2: "Bandwidth shouldn't gate them.",
    },
    lead:
      "The work is the field. The posting shouldn't be. Aloha cuts a 40% discount for nonprofits on every paid plan — and the free plan covers most of what a small org needs. No paperwork, no demos; one form, one confirmation.",
    accent: "bg-peach-200",
    pains: [
      {
        pain: "Volunteers rotate; the voice shouldn't",
        resolution:
          "Voice model stays with the org, not the person. Hand-offs preserve the tone the audience is used to.",
        feature: "Composer",
        href: "/composer",
      },
      {
        pain: "Donor questions deserve a reply, not a bot",
        resolution:
          "Inbox triage surfaces the donor messages worth answering; praise gets a quick, warm thanks. Nothing auto-sent without approval.",
        feature: "Inbox",
        href: "/inbox",
      },
      {
        pain: "You shouldn't pay enterprise prices for mission work",
        resolution:
          "40% discount on every paid plan. Verified nonprofits get the upgrade in a day.",
        feature: "Pricing",
        href: "/pricing",
      },
    ],
    day: [
      { time: "08:30", label: "field update email arrives from partner", tone: "bg-peach-100" },
      { time: "10:00", label: "Composer drafts across IG / FB / LinkedIn", tone: "bg-peach-200" },
      { time: "13:00", label: "volunteer approves, minor tone edit", tone: "bg-primary-soft" },
      { time: "15:30", label: "donor-question inbox triage · two replies", tone: "bg-peach-300" },
      { time: "17:00", label: "weekly digest emails the board", tone: "bg-muted" },
    ],
    recommendedPlan: {
      slug: "nonprofit",
      name: "Any paid plan · 40% off",
      priceLabel: "From $9.60 / month",
      why:
        "Nonprofits get 40% off the Working Team and Agency plans, verified via a single tax-ID submission. No multi-year contracts.",
    },
    channels: ["facebook", "instagram", "linkedin"],
    topFeatures: [
      { name: "Org-wide voice model", why: "Volunteers rotate, voice stays", href: "/composer" },
      { name: "Donor inbox triage", why: "Real questions answered; noise muted", href: "/inbox" },
      { name: "40% nonprofit discount", why: "No paperwork — just an email", href: "/pricing" },
    ],
    testimonial: {
      q: "Our comms volunteer shifts every six months. Aloha's voice model means the next person inherits the cadence, not a blank page.",
      n: "Arjun S.",
      r: "Comms lead · literacy nonprofit · 8K IG",
      ini: "A",
    },
    cta: { line1: "Tell the stories.", line2: "We'll handle the plumbing." },
    heroPhotoNotes:
      "Nonprofit work in context — someone editing a photo from a field visit, phone showing a drafted post. Warm, unglossy. 4:5 vertical. Mood is purposeful, not performative.",
  },
};

export const PERSONA_SLUGS = Object.keys(PERSONAS);
