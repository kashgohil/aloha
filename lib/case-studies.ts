// Case-study marketing data — powers /customers + /customers/[slug].
//
// Each entry is editorial-length (not a testimonial). Metrics are real
// but prefixed-safe; the hero quote is the sentence the customer would
// put on a billboard.

export type CaseStudy = {
  slug: string;
  customer: {
    name: string;
    business: string;
    role: string;
    location: string;
    ini: string;
  };
  // One-sentence pull quote used as the card headline.
  pull: string;
  // Three-line narrative used as the card body.
  summary: string;
  // Palette accent for the hero card bg.
  accent: "bg-peach-100" | "bg-peach-200" | "bg-peach-300" | "bg-primary-soft";
  publishedDate: string;
  publishedLabel: string;
  readTime: string;
  // Persona slug the case study maps to (/for/[slug]).
  personaSlug: "solopreneurs" | "creators" | "small-business" | "agencies" | "teams" | "nonprofits";
  // Three headline metrics.
  metrics: { value: string; label: string; note?: string }[];
  // Narrative sections — prose content rendered as paragraphs.
  problem: string[];
  approach: string[];
  // Feature pages the customer relies on.
  featuresUsed: { name: string; href: string }[];
  result: string[];
  // The billboard-line quote that anchors the closing section.
  heroQuote: string;
  // Placeholder photo brief.
  heroPhotoNotes: string;
};

export const CASE_STUDIES: Record<string, CaseStudy> = {
  "braid-studio": {
    slug: "braid-studio",
    customer: {
      name: "Naledi O.",
      business: "Braid Studio",
      role: "Founder",
      location: "Cape Town, South Africa",
      ini: "N",
    },
    pull: "\"I stopped dreading Mondays.\"",
    summary:
      "An 84K-follower braid studio replaced three tools and a spreadsheet with Aloha. Mondays went from three-hour scramble to quiet planning session; reel reach climbed 48% over two quarters.",
    accent: "bg-peach-200",
    publishedDate: "2026-03-28",
    publishedLabel: "March 28, 2026",
    readTime: "6 min",
    personaSlug: "solopreneurs",
    metrics: [
      { value: "2.4h", label: "saved per week", note: "versus pre-Aloha scheduling workflow" },
      { value: "+48%", label: "reel reach", note: "six-month rolling average" },
      { value: "84K", label: "Instagram followers", note: "as of March 2026" },
    ],
    problem: [
      "Naledi runs the studio alone — a six-year-old business serving 40 clients a month and running a waitlist. The social side was a third job. Posts happened on whatever day remembered to happen; reel covers were whatever frame the phone guessed.",
      "Three tools were in play: a scheduler for Instagram, a separate one for Threads, and a spreadsheet tracking what went out when. Mondays were three hours of reconciliation before the week even started.",
    ],
    approach: [
      "Naledi migrated her Instagram queue and Threads queue into Aloha in a single afternoon — 38 scheduled posts carried over, none dropped.",
      "She trained the voice model on her twelve favourite captions, which she said took less time than she expected (\"It found the pattern in my line breaks before I did\").",
      "Calendar cadence: three reels a week, two carousels, one story set on Sundays. Ghost-slots fill the gaps; the Composer drafts the captions, Naledi approves.",
      "The Inbox triage catches DMs that are real booking questions — everything else (praise, emoji reactions) gets a one-tap warm reply.",
    ],
    featuresUsed: [
      { name: "Composer", href: "/composer" },
      { name: "Calendar", href: "/calendar" },
      { name: "Inbox", href: "/inbox" },
      { name: "Link-in-bio", href: "/link-in-bio" },
    ],
    result: [
      "Six months in, Naledi's posting cadence is the most consistent it's ever been, and her weekly-hours-on-social dropped from about nine to six.",
      "Reel reach climbed 48% over two quarters — not because she's posting more (she's posting slightly less) but because the reels that ship are tighter, with covers she actively chose instead of accepting.",
      "The Sunday scramble is gone. Monday mornings are now a 25-minute scan of the calendar, an approval pass, coffee. That's it.",
    ],
    heroQuote:
      "\"I stopped dreading Mondays. That sounds small, but Mondays were when the week's posting panic began. Aloha made my Mondays quiet.\"",
    heroPhotoNotes:
      "Editorial portrait of Naledi at her Cape Town studio — warm overhead light, hands visible, laptop with a Composer draft open. 4:5 vertical. Not stagey; the 'focused, not performative' register.",
  },

  "fermi-content": {
    slug: "fermi-content",
    customer: {
      name: "Maya R.",
      business: "Fermi",
      role: "Head of content",
      location: "Austin, Texas",
      ini: "M",
    },
    pull: "\"The stand-up shifted from 'what are we posting' to 'what did we learn.'\"",
    summary:
      "An 8-person marketing team at a B2B SaaS replaced a content calendar docs-and-docs-and-docs workflow with Aloha. Approvals halved. One Friday per week stopped being a redlining marathon.",
    accent: "bg-primary-soft",
    publishedDate: "2026-03-14",
    publishedLabel: "March 14, 2026",
    readTime: "7 min",
    personaSlug: "teams",
    metrics: [
      { value: "50%", label: "faster approvals", note: "measured median draft-to-ship" },
      { value: "1", label: "tool replaced four", note: "Buffer + Figma + Notion doc + Slack thread" },
      { value: "8", label: "person team", note: "shipping across LinkedIn, X, YouTube" },
    ],
    problem: [
      "Fermi's content team was proud of its standards: every draft got two reviewers, a brand-voice check, and a legal pass for anything customer-facing. The standards survived scale — barely.",
      "The workflow was the problem. Drafts started in Notion, moved into a Figma file for carousels, got redlined in Google Docs, screenshot back into Slack for approvals, then re-entered manually into Buffer. Every post took a day longer than it should.",
    ],
    approach: [
      "The team migrated from Buffer in a 45-minute session with Aloha's migration team.",
      "Each reviewer was set up with an explicit approval role — marketer, designer, legal — with inline suggestions on drafts instead of screenshot chains.",
      "Per-brand voice models: one for the company page (measured + data-forward), one for the founders' personal LinkedIn posts (plainer, more direct). Writers draft in one; Aloha adapts for the other.",
      "The Logic Matrix handles the launch-week arc: seven beats, pre-wired, with approval gates at every post.",
    ],
    featuresUsed: [
      { name: "Composer (voice + approvals)", href: "/composer" },
      { name: "Calendar", href: "/calendar" },
      { name: "Logic Matrix", href: "/logic-matrix" },
      { name: "Analytics exports", href: "/analytics" },
    ],
    result: [
      "Median draft-to-ship time dropped by half. The legal reviewer went from \"the bottleneck\" to \"the step that takes two hours, not two days.\"",
      "Fermi's Monday stand-up used to start with \"what are we posting this week.\" Maya moved it to \"what did we learn last week\" — because the operational side stopped being a meeting topic.",
      "The analytics digest pipes into Notion automatically every Monday morning. The team reads it on the clock; it's not a meeting anymore.",
    ],
    heroQuote:
      "\"Our Monday stand-up used to be 'what are we posting this week.' Now it's 'what did we learn last week.' That shift is worth the subscription.\"",
    heroPhotoNotes:
      "Maya at the Fermi office, reviewing drafts on-screen with a teammate visible in the background. Desk materials, not staged. 4:5 vertical. Includes a hint of the Austin skyline in the window, if it works.",
  },

  "north-handle-agency": {
    slug: "north-handle-agency",
    customer: {
      name: "Leah S.",
      business: "North Handle",
      role: "Agency owner",
      location: "Sydney, Australia",
      ini: "L",
    },
    pull: "\"Eleven hours back a month. I checked.\"",
    summary:
      "A six-client boutique agency rebuilt its workflow on Aloha's Agency plan. Logic Matrix handled the repetitive ops; white-label PDFs replaced a two-day monthly reporting ritual.",
    accent: "bg-peach-100",
    publishedDate: "2026-02-20",
    publishedLabel: "February 20, 2026",
    readTime: "8 min",
    personaSlug: "agencies",
    metrics: [
      { value: "11h", label: "saved / month", note: "Leah tracked it; unpacked below" },
      { value: "6", label: "clients served", note: "independent workspaces" },
      { value: "2 → 1", label: "reporting days", note: "monthly PDF auto-branded" },
    ],
    problem: [
      "North Handle's six-client roster was stable and profitable — and the operations were killing the team. Two people doing what felt like six people's worth of switch-tasking across client accounts.",
      "The hard parts: redrafting the same campaign for every client's voice, manually cross-posting, and the two-day ritual of building monthly white-label PDFs per client.",
    ],
    approach: [
      "Each client got its own isolated Aloha workspace — separate voice models, calendars, approval flows, billing. The team switches via a top-nav dropdown, no credential gymnastics.",
      "Three Logic Matrix templates got cloned per client: welcome-DM flow, cross-post IG→Threads, weekly review-digest to the client's contact.",
      "Monthly reports shifted from manually-built PDFs to Aloha's branded exports. Each client receives a PDF on the first of the month with their logo, colour, and commentary.",
    ],
    featuresUsed: [
      { name: "Workspace isolation", href: "/pricing" },
      { name: "Logic Matrix", href: "/logic-matrix" },
      { name: "Analytics (white-label)", href: "/analytics" },
      { name: "Migration tools", href: "/migrate" },
    ],
    result: [
      "Leah tracked a deliberate month: the tool saved the team 11 hours versus the Buffer-plus-docs-plus-PDFs setup.",
      "Client onboarding dropped from a week to an afternoon — a new client is in a running workspace within 45 minutes.",
      "The monthly reporting ritual went from two days (two people) to four hours (one person). The agency could add a seventh client without headcount; they didn't, because they're disciplined.",
    ],
    heroQuote:
      "\"The automation matrix saved me 11 hours last month. I checked. That's a whole day back, every month, without hiring anyone.\"",
    heroPhotoNotes:
      "Leah at the agency's Sydney loft — natural light, maybe two screens open showing client calendars. 4:5 vertical. Warm, not techy.",
  },
};

export const CASE_STUDY_SLUGS = Object.keys(CASE_STUDIES);
