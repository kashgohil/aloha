// Channel marketing data — consumed by app/(marketing)/channels/[channel]/page.tsx.
// One entry per supported network. The landing page's channels grid also points
// at these.
//
// When adding a channel:
//  1. add an entry here
//  2. add a SOCIAL_ICONS entry if not already present
//  3. add the slug to routes.channels in lib/routes.ts

export type Channel = {
  slug: string;
  name: string;
  // Shown under the hero headline — "Aloha for {tagline}"
  tagline: string;
  // One sentence above the hero headline (replaces default eyebrow).
  eyebrow: string;
  // Two-line hero headline split across two renders.
  headline: { line1: string; line2: string };
  // Paragraph under the hero headline.
  lead: string;
  // Palette accent for the hero card background.
  accent: "bg-peach-100" | "bg-peach-200" | "bg-peach-300" | "bg-peach-400" | "bg-primary-soft";
  // Post types we render in the "what you can post" grid.
  postTypes: { label: string; desc: string; tone: string }[];
  // Native features we support — honest checklist.
  supports: string[];
  // Native features not yet supported. Empty array if parity.
  missing: string[];
  // Voice/tone guidance for this channel. 1–2 sentences.
  voiceNote: string;
  // 24 integers 0–100, representing average engagement by hour (local time).
  // Rendered as a compact bar chart in the "best time" section.
  bestTimes: number[];
  // One-sentence insight about the best-time chart.
  peakInsight: string;
  // Three starter templates. `count` is a string like "3 posts".
  templates: { name: string; desc: string; count: string }[];
  // One testimonial from a creator who posts mainly on this channel.
  testimonial: { q: string; n: string; r: string; ini: string; tone: string };
  // Two-line final CTA headline.
  cta: { line1: string; line2: string };
};

export const CHANNELS: Record<string, Channel> = {
  instagram: {
    slug: "instagram",
    name: "Instagram",
    tagline: "Posts. Reels. Stories. Carousels.",
    eyebrow: "For Instagram",
    headline: {
      line1: "Make the grid",
      line2: "feel less like a second job.",
    },
    lead:
      "Schedule posts, carousels, reels and stories — native cover frames, native tags, native everything. Aloha writes captions in your voice and keeps the aesthetic coherent across four beats a week.",
    accent: "bg-peach-200",
    postTypes: [
      { label: "Posts", desc: "Single image or video with caption, location, product tags, collab tags.", tone: "bg-peach-100" },
      { label: "Carousels", desc: "Up to 10 slides. First-frame cover, per-slide alt-text, link in each slide's caption.", tone: "bg-peach-200" },
      { label: "Reels", desc: "Native scheduling with cover-frame picker, trending audio check, and reel-length hints.", tone: "bg-peach-300" },
      { label: "Stories", desc: "Queue and chain stories; mentions, polls, questions, and link stickers supported.", tone: "bg-primary-soft" },
    ],
    supports: [
      "Native reel scheduling (no 'mobile reminder' hack)",
      "Collab tags — dual-post with another account",
      "Product tags for shopping posts",
      "Cross-post to Threads from the same draft",
      "Auto-alt-text on every image (editable)",
    ],
    missing: [
      "Live scheduling (IG doesn't expose it to anyone, yet)",
    ],
    voiceNote:
      "Instagram captions want soft first lines and a break after the hook. Composer keeps yours warm, with line-breaks where the app eats whitespace.",
    bestTimes: [
      5, 4, 3, 3, 4, 6, 12, 22, 38, 52, 60, 64,
      70, 62, 48, 42, 38, 46, 58, 72, 78, 62, 40, 18,
    ],
    peakInsight:
      "Your reach peaks 8–10pm local — after dinner, before doom-scroll. The morning window is half that.",
    templates: [
      { name: "Weekly trio", desc: "One post, one carousel, one reel. Keeps the grid varied without extra brain.", count: "3 posts" },
      { name: "Launch drop", desc: "Teaser reel → carousel announce → story series → 'last 24h' pin.", count: "7 posts" },
      { name: "Recap Sunday", desc: "End-of-week story set pulling in your five best posts. Auto-generated.", count: "1 story" },
    ],
    testimonial: {
      q: "The reel cover frames stopped being a Tuesday morning panic. Aloha picks a frame, I override one in ten, done.",
      n: "Ainslee D.",
      r: "Studio owner · 14K on Instagram",
      ini: "A",
      tone: "bg-peach-200",
    },
    cta: { line1: "Own the grid.", line2: "Skip the scramble." },
  },
  linkedin: {
    slug: "linkedin",
    name: "LinkedIn",
    tagline: "Long-form. Company pages. Documents.",
    eyebrow: "For LinkedIn",
    headline: {
      line1: "Long-form posts",
      line2: "without the LinkedIn voice.",
    },
    lead:
      "The composer writes in your cadence, not the 'what I learned from my plumber' flavour. Schedule to personal or company pages, attach PDFs, and run approval flows that keep juniors confident.",
    accent: "bg-primary-soft",
    postTypes: [
      { label: "Text posts", desc: "Long-form up to 3,000 characters. Preview wraps the way LinkedIn actually wraps.", tone: "bg-primary-soft" },
      { label: "Documents", desc: "PDF carousels. Page-by-page preview; LinkedIn renders them native.", tone: "bg-peach-100" },
      { label: "Articles", desc: "Full newsletter issues, with hero image and section anchors.", tone: "bg-peach-200" },
      { label: "Polls", desc: "Native polls with 7-day duration and real-time results read back into Analytics.", tone: "bg-peach-300" },
    ],
    supports: [
      "Personal profile and company page scheduling",
      "Document carousel (PDF) uploads with page preview",
      "Native articles with hero image and section anchors",
      "Polls with result readback in Analytics",
      "@-mentions with autocomplete across both audiences",
    ],
    missing: [
      "Events scheduling (LinkedIn API doesn't expose it yet)",
    ],
    voiceNote:
      "LinkedIn rewards a hook, a payoff, and a question. Composer trims the theatrical line breaks and keeps the thought — no 'plot twist' patterns unless you write that way.",
    bestTimes: [
      4, 3, 2, 2, 5, 10, 18, 28, 46, 62, 70, 72,
      68, 56, 48, 44, 38, 30, 24, 18, 14, 10, 8, 6,
    ],
    peakInsight:
      "LinkedIn runs on working hours — 10am–noon is the daily peak. Weekends barely exist.",
    templates: [
      { name: "Monday thought-piece", desc: "500-word essay with a hook, three beats, and a question close.", count: "1 post" },
      { name: "Document carousel", desc: "8-slide PDF that teaches one thing well. Auto-repurposes from a blog post.", count: "1 doc" },
      { name: "Case study drop", desc: "Story → numbers → lesson, paired with a Company Page cross-post.", count: "2 posts" },
    ],
    testimonial: {
      q: "The voice model writes in my cadence now. My editor can't always tell which drafts I wrote and which Aloha did.",
      n: "Priya N.",
      r: "Ghostwriter · 38K on LinkedIn",
      ini: "P",
      tone: "bg-primary-soft",
    },
    cta: { line1: "Land the hook.", line2: "Keep the voice." },
  },
  x: {
    slug: "x",
    name: "X",
    tagline: "Threads. Long-form. Polls. Quotes.",
    eyebrow: "For X",
    headline: {
      line1: "Threads that ship",
      line2: "on their own schedule.",
    },
    lead:
      "Write a thread once; Aloha handles the pacing, the numbering, and the 280-char squeeze per tweet. Long-form articles, polls and quote-reposts supported natively.",
    accent: "bg-peach-100",
    postTypes: [
      { label: "Single tweet", desc: "280 chars. Tightening on voice — Composer trims filler, keeps your hooks.", tone: "bg-peach-100" },
      { label: "Threads", desc: "Up to 25 tweets, auto-paced. Numbering optional. First-tweet hook drafted first.", tone: "bg-peach-200" },
      { label: "Long-form", desc: "Premium long-form posts, up to 25,000 characters with basic formatting.", tone: "bg-peach-300" },
      { label: "Polls", desc: "Up to 4 options, with duration and result readback.", tone: "bg-primary-soft" },
    ],
    supports: [
      "Thread composer with auto-paced drops",
      "Long-form Article support (premium)",
      "Quote-repost scheduling from saved tweets",
      "Polls with result import into Analytics",
      "Scheduled DMs for verified accounts",
    ],
    missing: [
      "Spaces scheduling (X doesn't expose it to third-parties)",
    ],
    voiceNote:
      "X rewards a single precise thought and punishes the padded one. Composer tightens to the tweet-length your voice actually uses — 119 chars for most of you, not the full 280.",
    bestTimes: [
      12, 8, 5, 4, 6, 14, 28, 46, 58, 64, 68, 62,
      56, 52, 50, 52, 58, 66, 74, 72, 60, 48, 32, 20,
    ],
    peakInsight:
      "Two peaks: 9–11am and 6–8pm. The 9am one is for news-adjacent takes; the evening one for stories.",
    templates: [
      { name: "Thursday thread", desc: "5-tweet thread, hook → beats → payoff. One a week keeps X warm.", count: "1 thread" },
      { name: "Tight take", desc: "Single tweet, Composer-tightened from a longer LinkedIn draft.", count: "1 tweet" },
      { name: "Weekly poll", desc: "One poll, scheduled for Tuesday morning when reply volume is highest.", count: "1 poll" },
    ],
    testimonial: {
      q: "okay aloha's calendar view is the first scheduler that respects my eyes",
      n: "@samwritesstuff",
      r: "Writer · 12K on X",
      ini: "S",
      tone: "bg-peach-100",
    },
    cta: { line1: "Say it once.", line2: "Say it well." },
  },
  tiktok: {
    slug: "tiktok",
    name: "TikTok",
    tagline: "Short-form. Drafts. Trending audio.",
    eyebrow: "For TikTok",
    headline: {
      line1: "Short-form,",
      line2: "slow-considered.",
    },
    lead:
      "A TikTok scheduler that doesn't pressure you into daily posting. Draft captions with trending-audio hooks, review the first frame, and ship on your rhythm.",
    accent: "bg-peach-400",
    postTypes: [
      { label: "Feed video", desc: "Full-length vertical video with caption, hashtags, and cover picker.", tone: "bg-peach-200" },
      { label: "Draft & review", desc: "Upload the video once; Composer handles the 30-second caption rewrite across your cadence.", tone: "bg-peach-300" },
      { label: "Duet / stitch prompt", desc: "Draft prompts for duets — the platform doesn't let us auto-post, so these are save-to-draft.", tone: "bg-peach-100" },
    ],
    supports: [
      "Native video scheduling with cover-frame picker",
      "Trending-audio hook suggestions (updated daily)",
      "Caption rewrite for TikTok's 2,200-char ceiling",
      "Cross-post to Reels and YouTube Shorts from the same draft",
    ],
    missing: [
      "Live scheduling (TikTok doesn't expose it)",
      "Sound library uploads (TikTok keeps this native)",
    ],
    voiceNote:
      "TikTok captions are the footer, not the message. Composer keeps them short and text-hook-adjacent, with hashtags that match your niche instead of the chart.",
    bestTimes: [
      18, 14, 10, 8, 6, 8, 16, 26, 34, 42, 48, 54,
      58, 56, 52, 48, 46, 52, 64, 78, 88, 72, 48, 28,
    ],
    peakInsight:
      "Late-night peak, 8–10pm. The feed rewards posting right before people settle in.",
    templates: [
      { name: "Weekly short", desc: "One short a week, with text hook in the first 1.5 seconds.", count: "1 video" },
      { name: "Reel + Short + TikTok", desc: "Repurpose one video across three channels with per-platform caption.", count: "3 posts" },
      { name: "Launch trailer", desc: "15-second trailer for a bigger piece — cross-posted with a link-in-bio update.", count: "2 posts" },
    ],
    testimonial: {
      q: "I stopped posting every day because I thought I had to. Aloha made 'one a week' look fine. It is fine.",
      n: "Juno L.",
      r: "Creator · 62K on TikTok",
      ini: "J",
      tone: "bg-peach-300",
    },
    cta: { line1: "Post less.", line2: "Post better." },
  },
  threads: {
    slug: "threads",
    name: "Threads",
    tagline: "Native cross-post from Instagram.",
    eyebrow: "For Threads",
    headline: {
      line1: "The calmest place",
      line2: "to be a writer right now.",
    },
    lead:
      "Threads rewards short, thoughtful posts — Aloha mirrors your Instagram calendar to Threads with native cross-post, and drafts Threads-first pieces when the thought is its own.",
    accent: "bg-peach-200",
    postTypes: [
      { label: "Text post", desc: "Up to 500 characters. Composer tightens from your longer drafts, or drafts Threads-first.", tone: "bg-peach-200" },
      { label: "Image post", desc: "Single image or 10-image carousel with native caption.", tone: "bg-peach-100" },
      { label: "Link post", desc: "Native link preview with editable title + description.", tone: "bg-primary-soft" },
    ],
    supports: [
      "Native cross-post from Instagram (uses the platform API)",
      "Threads-first drafts that don't duplicate to IG",
      "Tagging other Threads accounts with autocomplete",
      "Reply chains scheduled in sequence",
    ],
    missing: [
      "Poll posts (Threads doesn't have them)",
    ],
    voiceNote:
      "Threads is conversational, not performative. Composer drops the 'here's how to 10x your life' cadence and keeps the observation.",
    bestTimes: [
      10, 8, 6, 5, 5, 8, 16, 26, 38, 48, 54, 58,
      56, 52, 48, 46, 44, 48, 56, 64, 70, 60, 42, 22,
    ],
    peakInsight:
      "Flatter than other channels — Threads audience reads all day. No single peak to chase.",
    templates: [
      { name: "IG mirror", desc: "Auto-mirror every IG post to Threads 15 minutes later, with native formatting.", count: "mirror rule" },
      { name: "Threads-first observation", desc: "A single short thought, written for Threads' quieter reader.", count: "1 post" },
      { name: "Thread-of-threads", desc: "A 4-post reply chain that reads like a small essay.", count: "4 posts" },
    ],
    testimonial: {
      q: "if you post on more than two platforms and you're not using this you're just doing chores",
      n: "@leahmakes",
      r: "Maker · 8K on Threads",
      ini: "L",
      tone: "bg-peach-200",
    },
    cta: { line1: "Write thoughtful.", line2: "Ship often." },
  },
  facebook: {
    slug: "facebook",
    name: "Facebook",
    tagline: "Pages. Groups. Events.",
    eyebrow: "For Facebook",
    headline: {
      line1: "Page, group,",
      line2: "and the people who still live here.",
    },
    lead:
      "For the audience that hasn't moved — family businesses, local communities, groups of 20,000 who check daily. Schedule to pages and groups, pin posts, and track what actually gets shared.",
    accent: "bg-peach-100",
    postTypes: [
      { label: "Page posts", desc: "Text, image, link or video post to your business page.", tone: "bg-peach-100" },
      { label: "Group posts", desc: "Post to groups you admin. Pin-to-top and announcement support.", tone: "bg-peach-200" },
      { label: "Albums", desc: "Multi-image upload with per-image captions. Auto-carouselled.", tone: "bg-peach-300" },
      { label: "Events", desc: "Create event posts with date, location, and cover. Cross-post to group.", tone: "bg-primary-soft" },
    ],
    supports: [
      "Page scheduling (personal feeds not supported — Meta pulled this)",
      "Group posts with pin-to-top",
      "Event creation with cross-post to group",
      "Cross-post a draft to IG + FB simultaneously",
      "Reshare tracking — see who shared, not just how many",
    ],
    missing: [
      "Personal timeline posts (Meta restricted third-party access in 2024)",
    ],
    voiceNote:
      "Facebook audiences read the first sentence and scroll. Composer leads with the headline thought and saves the context for the body.",
    bestTimes: [
      6, 4, 3, 3, 5, 10, 20, 32, 44, 52, 56, 54,
      50, 46, 44, 42, 40, 42, 48, 58, 62, 52, 34, 16,
    ],
    peakInsight:
      "Morning + evening commute windows. 8–10am and 7–9pm carry most of the reach.",
    templates: [
      { name: "Weekly update", desc: "One page post + one group post a week. Paired so they don't compete.", count: "2 posts" },
      { name: "Local event push", desc: "Event creation + 3 reminder posts over the two weeks before.", count: "4 posts" },
      { name: "Community spotlight", desc: "Member feature post with photo permissions auto-asked.", count: "1 post" },
    ],
    testimonial: {
      q: "Facebook's where half my customers live. Aloha's the only scheduler that still takes it seriously.",
      n: "Marta R.",
      r: "Neighborhood bakery · 21K page",
      ini: "M",
      tone: "bg-peach-100",
    },
    cta: { line1: "Stay present.", line2: "For the people who stayed." },
  },
  pinterest: {
    slug: "pinterest",
    name: "Pinterest",
    tagline: "Pins. Boards. Idea pins.",
    eyebrow: "For Pinterest",
    headline: {
      line1: "A search engine",
      line2: "that pays out for years.",
    },
    lead:
      "Pinterest is the long-tail. Pins you publish this week will still find readers eighteen months from now. Aloha handles board strategy, descriptions with SEO that isn't cringe, and rich pins.",
    accent: "bg-peach-300",
    postTypes: [
      { label: "Standard pin", desc: "Single image or video pin with title, description, destination URL.", tone: "bg-peach-300" },
      { label: "Idea pin", desc: "Multi-slide native content, up to 20 pages. No outbound link.", tone: "bg-peach-200" },
      { label: "Product pin", desc: "Rich pin with live price and availability from your commerce feed.", tone: "bg-peach-400" },
      { label: "Video pin", desc: "Short vertical video with thumbnail picker and description.", tone: "bg-primary-soft" },
    ],
    supports: [
      "Pin and idea-pin scheduling with destination URLs",
      "Board-aware scheduling — auto-sorts into your right boards",
      "Rich product pins from a commerce feed (Shopify, WooCommerce)",
      "SEO description drafts — keywords suggested, not keyword-stuffed",
      "Bulk-upload from a CSV + image folder",
    ],
    missing: [
      "Paid pin promotion (handled inside Pinterest Ads)",
    ],
    voiceNote:
      "Pinterest descriptions are indexed like search-engine copy, not social captions. Composer drafts them with natural keywords and a single clear payoff.",
    bestTimes: [
      20, 14, 10, 8, 10, 16, 26, 38, 46, 52, 54, 52,
      50, 48, 46, 44, 46, 52, 60, 68, 74, 66, 48, 32,
    ],
    peakInsight:
      "Pinterest is an evening channel — 7–10pm dominates. But the long tail means any time still works.",
    templates: [
      { name: "Weekly board refresh", desc: "5 pins a week, auto-sorted into topic boards, all with evergreen descriptions.", count: "5 pins" },
      { name: "Long-tail series", desc: "12-pin series on one topic. Pinterest pushes them for months.", count: "12 pins" },
      { name: "Product pin drop", desc: "New arrival feed → auto-pin to your shop boards with rich pin data.", count: "variable" },
    ],
    testimonial: {
      q: "Pinterest brings me more traffic than Instagram now. I just had to actually post to it.",
      n: "Tara H.",
      r: "Food blogger · 340K monthly views",
      ini: "T",
      tone: "bg-peach-300",
    },
    cta: { line1: "Plant the pin.", line2: "Watch it grow." },
  },
  youtube: {
    slug: "youtube",
    name: "YouTube",
    tagline: "Shorts. Community posts.",
    eyebrow: "For YouTube",
    headline: {
      line1: "Long videos live",
      line2: "on your own terms.",
    },
    lead:
      "We don't try to replace YouTube Studio for full uploads — we handle Shorts and Community posts, and we time them to pair with your long-form drops.",
    accent: "bg-peach-400",
    postTypes: [
      { label: "Shorts", desc: "Under-60-second vertical video with title, description, and thumbnail picker.", tone: "bg-peach-400" },
      { label: "Community post", desc: "Text, image, or poll post to your channel's community tab.", tone: "bg-peach-200" },
      { label: "Premiere scheduling", desc: "Stage a premiere for a long-form video uploaded elsewhere.", tone: "bg-primary-soft" },
    ],
    supports: [
      "Shorts scheduling with thumbnail pick and hashtag suggestions",
      "Community posts (text, image, poll)",
      "Premiere scheduling for long-form videos uploaded to YouTube Studio",
      "Cross-post Shorts to TikTok and Reels from one draft",
    ],
    missing: [
      "Long-form uploads (stay in YouTube Studio; that's where they belong)",
      "Live streaming (handled by YouTube Live)",
    ],
    voiceNote:
      "YouTube descriptions are for the algorithm AND the reader — Composer drafts a reader-first first paragraph, then adds chapter markers and keywords below.",
    bestTimes: [
      8, 6, 4, 3, 4, 8, 14, 22, 32, 42, 48, 52,
      54, 52, 50, 48, 50, 56, 64, 72, 78, 70, 52, 28,
    ],
    peakInsight:
      "Shorts peak 7–10pm; Community posts get morning-commute bumps around 8–9am.",
    templates: [
      { name: "Short + Community pair", desc: "One Short + one Community post per long-form video.", count: "2 posts" },
      { name: "Shorts series", desc: "5 Shorts cut from one long-form, scheduled daily across a week.", count: "5 shorts" },
      { name: "Premiere build-up", desc: "Community post teaser 3 days out + day-of premiere reminder.", count: "2 posts" },
    ],
    testimonial: {
      q: "Community posts used to be an afterthought. Now they're half my reach between videos.",
      n: "Devon A.",
      r: "Creator · 120K on YouTube",
      ini: "D",
      tone: "bg-peach-400",
    },
    cta: { line1: "Pair the Short.", line2: "Stretch the view." },
  },
  bluesky: {
    slug: "bluesky",
    name: "Bluesky",
    tagline: "Feeds. Threads. No algorithm.",
    eyebrow: "For Bluesky",
    headline: {
      line1: "Your voice,",
      line2: "no filters in the way.",
    },
    lead:
      "Bluesky is the open social web with no algorithmic feed to fight. Post text, images, and threads — Composer keeps your cadence natural without trimming for reach.",
    accent: "bg-primary-soft",
    postTypes: [
      { label: "Text post", desc: "Up to 300 chars recommended for visibility, but no hard limit.", tone: "bg-primary-soft" },
      { label: "Image post", desc: "Single image or 4-image grid with alt text, up to 1MB each.", tone: "bg-peach-100" },
      { label: "Thread", desc: "Reply to your own posts to create threaded conversations.", tone: "bg-peach-200" },
    ],
    supports: [
      "Text posts with rich link previews",
      "Image posts with alt text",
      "Threaded replies (self-replies to thread)",
      "Custom feed scheduling coming soon",
    ],
    missing: [
      "Video posts (in beta on Bluesky)",
      "Custom feeds (API access needed)",
    ],
    voiceNote:
      "Bluesky rewards authentic voice over performance. Composer keeps your posts natural — no keyword stuffing, no performative hooks.",
    bestTimes: [
      8, 6, 4, 3, 4, 8, 14, 22, 32, 42, 48, 52,
      54, 52, 50, 48, 50, 56, 64, 72, 78, 70, 52, 28,
    ],
    peakInsight:
      "Bluesky has two peaks: morning (9–11am) and evening (7–10pm). The platform is more synchronous than others — readers engage when they see it.",
    templates: [
      { name: "Daily check-in", desc: "One short observation, posted at your morning window.", count: "1 post" },
      { name: "Thread of thoughts", desc: "3–5 replies that build a single idea together.", count: "1 thread" },
      { name: "Link drop", desc: "An interesting link with a 2-sentence commentary.", count: "1 post" },
    ],
    testimonial: {
      q: "Finally a place where I can just... post. No games, no reach metrics, just people reading what I write.",
      n: "Mara S.",
      r: "Writer · 4K on Bluesky",
      ini: "M",
      tone: "bg-primary-soft",
    },
    cta: { line1: "Post freely.", line2: "No games attached." },
  },

  medium: {
    slug: "medium",
    name: "Medium",
    tagline: "Articles. Stories. Long-form.",
    eyebrow: "For Medium",
    headline: {
      line1: "Your ideas",
      line2: "deserve more than a thread.",
    },
    lead:
      "Publish articles directly from Aloha. Write once, cross-publish to Medium alongside your social posts — same draft, different format, zero copy-paste.",
    accent: "bg-peach-100",
    postTypes: [
      { label: "Articles", desc: "Full-length posts in Markdown. Title, body, and tags — published straight to your profile.", tone: "bg-peach-100" },
      { label: "Stories", desc: "Personal essays, how-tos, and opinion pieces. Medium's algorithm favours substance over flash.", tone: "bg-peach-200" },
      { label: "Series", desc: "Multi-part articles that build a narrative over days or weeks. Schedule each part in your queue.", tone: "bg-peach-300" },
    ],
    supports: [
      "Article publishing (Markdown)",
      "Embedded images",
      "Auto-generated titles from content",
      "Public publish status",
      "Cross-post from the same draft as social",
    ],
    missing: [
      "Publication submissions (manual for now)",
      "Draft-only publishing",
      "Tags via API (Medium deprecated this)",
    ],
    voiceNote:
      "Medium readers expect depth. Lead with insight, not hooks. A 4-minute read that teaches something will always outperform a 12-minute ramble.",
    bestTimes: [
      6, 4, 3, 2, 3, 6, 12, 22, 38, 52, 60, 58,
      54, 48, 44, 42, 44, 50, 58, 62, 56, 42, 24, 12,
    ],
    peakInsight:
      "Medium readers peak mid-morning (9–11am) on weekdays. Tuesday and Wednesday see the most engagement — publish your best pieces then.",
    templates: [
      { name: "Weekly essay", desc: "One long-form article published every Tuesday morning.", count: "1 article" },
      { name: "How-to guide", desc: "Step-by-step tutorial with code snippets or screenshots.", count: "1 article" },
      { name: "Cross-post bundle", desc: "Repurpose a LinkedIn post into a full Medium article.", count: "1 article" },
    ],
    testimonial: {
      q: "I used to spend 30 minutes reformatting every blog post. Now I write once in Aloha and it goes to Medium and LinkedIn in the same click.",
      n: "Jamie R.",
      r: "Developer advocate · 8K followers",
      ini: "J",
      tone: "bg-peach-100",
    },
    cta: { line1: "Write once.", line2: "Publish everywhere." },
  },
};

export const CHANNEL_SLUGS = Object.keys(CHANNELS);
