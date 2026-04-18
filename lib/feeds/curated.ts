// Aloha-curated feed catalog. Seeded by hand; updated with real usage
// signal. Each entry is subscribable by a single click from the feed
// reader's "Discover" section.

export type CuratedFeed = {
  url: string;
  siteUrl: string;
  title: string;
  description: string;
  category: string;
};

export const CURATED_CATEGORIES = [
  "Marketing",
  "Product",
  "Design",
  "Engineering",
  "AI",
  "Creators",
  "Business",
] as const;

export type CuratedCategory = (typeof CURATED_CATEGORIES)[number];

export const CURATED_FEEDS: CuratedFeed[] = [
  // Marketing
  {
    url: "https://www.marketingbrew.com/rss.xml",
    siteUrl: "https://www.marketingbrew.com/",
    title: "Marketing Brew",
    description: "Daily marketing news, without the marketing-speak.",
    category: "Marketing",
  },
  {
    url: "https://cxl.com/institute/blog/feed/",
    siteUrl: "https://cxl.com/institute/blog/",
    title: "CXL",
    description: "Conversion, analytics, and growth essays.",
    category: "Marketing",
  },
  {
    url: "https://seths.blog/feed/",
    siteUrl: "https://seths.blog/",
    title: "Seth's Blog",
    description: "Daily notes on marketing, change, and taste.",
    category: "Marketing",
  },
  {
    url: "https://www.marketingprofs.com/rss/all.xml",
    siteUrl: "https://www.marketingprofs.com/",
    title: "MarketingProfs",
    description: "Practical marketing how-tos and research.",
    category: "Marketing",
  },
  {
    url: "https://contentmarketinginstitute.com/feed/",
    siteUrl: "https://contentmarketinginstitute.com/",
    title: "Content Marketing Institute",
    description: "The playbook for content-led brands.",
    category: "Marketing",
  },
  {
    url: "https://ahrefs.com/blog/feed/",
    siteUrl: "https://ahrefs.com/blog/",
    title: "Ahrefs Blog",
    description: "SEO and content marketing, data-first.",
    category: "Marketing",
  },
  {
    url: "https://moz.com/blog/feed",
    siteUrl: "https://moz.com/blog",
    title: "Moz Blog",
    description: "SEO strategy, technical and creative.",
    category: "Marketing",
  },
  {
    url: "https://blog.hubspot.com/marketing/rss.xml",
    siteUrl: "https://blog.hubspot.com/marketing",
    title: "HubSpot Marketing",
    description: "Broad marketing coverage from HubSpot's team.",
    category: "Marketing",
  },
  {
    url: "https://neilpatel.com/blog/feed/",
    siteUrl: "https://neilpatel.com/blog/",
    title: "Neil Patel",
    description: "Growth marketing tactics and experiments.",
    category: "Marketing",
  },
  {
    url: "https://everyonehatesmarketers.com/feed",
    siteUrl: "https://everyonehatesmarketers.com/",
    title: "Everyone Hates Marketers",
    description: "Louis Grenier on no-BS positioning.",
    category: "Marketing",
  },

  // Product
  {
    url: "https://www.lennysnewsletter.com/feed",
    siteUrl: "https://www.lennysnewsletter.com/",
    title: "Lenny's Newsletter",
    description: "Product, growth, and career by Lenny Rachitsky.",
    category: "Product",
  },
  {
    url: "https://www.producttalk.org/feed/",
    siteUrl: "https://www.producttalk.org/",
    title: "Product Talk",
    description: "Teresa Torres on continuous discovery.",
    category: "Product",
  },
  {
    url: "https://www.mindtheproduct.com/feed/",
    siteUrl: "https://www.mindtheproduct.com/",
    title: "Mind the Product",
    description: "Community essays on product management.",
    category: "Product",
  },
  {
    url: "https://productcoalition.com/feed",
    siteUrl: "https://productcoalition.com/",
    title: "Product Coalition",
    description: "Collective writing from product leaders.",
    category: "Product",
  },
  {
    url: "https://www.svpg.com/feed/",
    siteUrl: "https://www.svpg.com/",
    title: "Silicon Valley Product Group",
    description: "Marty Cagan on product strategy and teams.",
    category: "Product",
  },
  {
    url: "https://cutlefish.substack.com/feed",
    siteUrl: "https://cutlefish.substack.com/",
    title: "The Beautiful Mess",
    description: "John Cutler on product, teams, and thinking in systems.",
    category: "Product",
  },
  {
    url: "https://blog.producthunt.com/feed",
    siteUrl: "https://blog.producthunt.com/",
    title: "Product Hunt Blog",
    description: "Launches, founder stories, and maker trends.",
    category: "Product",
  },
  {
    url: "https://www.sachinrekhi.com/rss",
    siteUrl: "https://www.sachinrekhi.com/",
    title: "Sachin Rekhi",
    description: "Essays on product management craft.",
    category: "Product",
  },
  {
    url: "https://www.intercom.com/blog/feed/",
    siteUrl: "https://www.intercom.com/blog/",
    title: "Intercom Blog",
    description: "Product, support, and customer communication.",
    category: "Product",
  },
  {
    url: "https://www.reforge.com/blog/rss.xml",
    siteUrl: "https://www.reforge.com/blog",
    title: "Reforge Blog",
    description: "Growth, retention, and product strategy essays.",
    category: "Product",
  },

  // Design
  {
    url: "https://uxdesign.cc/feed",
    siteUrl: "https://uxdesign.cc/",
    title: "UX Collective",
    description: "Essays on product design, curated.",
    category: "Design",
  },
  {
    url: "https://www.nngroup.com/feed/rss/",
    siteUrl: "https://www.nngroup.com/articles/",
    title: "Nielsen Norman Group",
    description: "UX research and usability articles.",
    category: "Design",
  },
  {
    url: "https://www.smashingmagazine.com/feed/",
    siteUrl: "https://www.smashingmagazine.com/",
    title: "Smashing Magazine",
    description: "Front-end, UX, and design engineering.",
    category: "Design",
  },
  {
    url: "https://alistapart.com/main/feed/",
    siteUrl: "https://alistapart.com/",
    title: "A List Apart",
    description: "Design, development, and meaning on the web.",
    category: "Design",
  },
  {
    url: "https://www.figma.com/blog/rss/",
    siteUrl: "https://www.figma.com/blog/",
    title: "Figma Blog",
    description: "Product updates and design craft from Figma.",
    category: "Design",
  },
  {
    url: "https://uxplanet.org/feed",
    siteUrl: "https://uxplanet.org/",
    title: "UX Planet",
    description: "Design process, case studies, and craft.",
    category: "Design",
  },
  {
    url: "https://www.invisionapp.com/inside-design/feed/",
    siteUrl: "https://www.invisionapp.com/inside-design/",
    title: "Inside Design",
    description: "Stories and practices from design teams.",
    category: "Design",
  },
  {
    url: "https://css-tricks.com/feed/",
    siteUrl: "https://css-tricks.com/",
    title: "CSS-Tricks",
    description: "Front-end techniques, CSS, and UI engineering.",
    category: "Design",
  },
  {
    url: "https://uxmovement.com/feed/",
    siteUrl: "https://uxmovement.com/",
    title: "UX Movement",
    description: "Small UX patterns, well explained.",
    category: "Design",
  },
  {
    url: "https://dribbble.com/stories.rss",
    siteUrl: "https://dribbble.com/stories",
    title: "Dribbble Stories",
    description: "Interviews and features from working designers.",
    category: "Design",
  },

  // Engineering
  {
    url: "https://newsletter.pragmaticengineer.com/feed",
    siteUrl: "https://newsletter.pragmaticengineer.com/",
    title: "The Pragmatic Engineer",
    description: "Big-tech engineering culture and career.",
    category: "Engineering",
  },
  {
    url: "https://martinfowler.com/feed.atom",
    siteUrl: "https://martinfowler.com/",
    title: "Martin Fowler",
    description: "Software architecture, refactoring, patterns.",
    category: "Engineering",
  },
  {
    url: "http://highscalability.com/rss.xml",
    siteUrl: "http://highscalability.com/",
    title: "High Scalability",
    description: "System architecture at internet scale.",
    category: "Engineering",
  },
  {
    url: "https://netflixtechblog.com/feed",
    siteUrl: "https://netflixtechblog.com/",
    title: "Netflix Tech Blog",
    description: "How Netflix builds and runs streaming at scale.",
    category: "Engineering",
  },
  {
    url: "https://www.uber.com/blog/rss/",
    siteUrl: "https://www.uber.com/blog/engineering/",
    title: "Uber Engineering",
    description: "Systems, data, and infra essays from Uber.",
    category: "Engineering",
  },
  {
    url: "https://stripe.com/blog/feed.rss",
    siteUrl: "https://stripe.com/blog",
    title: "Stripe Blog",
    description: "Engineering, product, and economic infra notes.",
    category: "Engineering",
  },
  {
    url: "https://blog.cloudflare.com/rss/",
    siteUrl: "https://blog.cloudflare.com/",
    title: "The Cloudflare Blog",
    description: "Networking, security, and platform deep-dives.",
    category: "Engineering",
  },
  {
    url: "https://overreacted.io/rss.xml",
    siteUrl: "https://overreacted.io/",
    title: "Overreacted",
    description: "Dan Abramov on React and fundamentals.",
    category: "Engineering",
  },
  {
    url: "https://jvns.ca/atom.xml",
    siteUrl: "https://jvns.ca/",
    title: "Julia Evans",
    description: "Programming, debugging, and systems notes.",
    category: "Engineering",
  },
  {
    url: "https://blog.logrocket.com/feed/",
    siteUrl: "https://blog.logrocket.com/",
    title: "LogRocket Blog",
    description: "Front-end engineering how-tos and reviews.",
    category: "Engineering",
  },

  // AI
  {
    url: "https://simonwillison.net/atom/everything/",
    siteUrl: "https://simonwillison.net/",
    title: "Simon Willison",
    description: "Daily notes on AI, LLMs, and the web.",
    category: "AI",
  },
  {
    url: "https://www.latent.space/feed",
    siteUrl: "https://www.latent.space/",
    title: "Latent Space",
    description: "AI engineering and tooling essays.",
    category: "AI",
  },
  {
    url: "https://jack-clark.net/feed/",
    siteUrl: "https://jack-clark.net/",
    title: "Import AI",
    description: "Weekly AI policy and research digest.",
    category: "AI",
  },
  {
    url: "https://www.deeplearning.ai/the-batch/feed/",
    siteUrl: "https://www.deeplearning.ai/the-batch/",
    title: "The Batch",
    description: "Andrew Ng's weekly AI news summary.",
    category: "AI",
  },
  {
    url: "https://openai.com/blog/rss.xml",
    siteUrl: "https://openai.com/blog",
    title: "OpenAI Blog",
    description: "Research and product updates from OpenAI.",
    category: "AI",
  },
  {
    url: "https://www.anthropic.com/news/rss.xml",
    siteUrl: "https://www.anthropic.com/news",
    title: "Anthropic News",
    description: "Anthropic's product and research announcements.",
    category: "AI",
  },
  {
    url: "https://blog.research.google/feeds/posts/default",
    siteUrl: "https://blog.research.google/",
    title: "Google Research",
    description: "Research posts across ML and systems.",
    category: "AI",
  },
  {
    url: "https://huggingface.co/blog/feed.xml",
    siteUrl: "https://huggingface.co/blog",
    title: "Hugging Face Blog",
    description: "Open-source models, libraries, and demos.",
    category: "AI",
  },
  {
    url: "https://www.aisnakeoil.com/feed",
    siteUrl: "https://www.aisnakeoil.com/",
    title: "AI Snake Oil",
    description: "Critical takes on AI hype and claims.",
    category: "AI",
  },
  {
    url: "https://gradientflow.com/feed/",
    siteUrl: "https://gradientflow.com/",
    title: "Gradient Flow",
    description: "Data, ML, and AI trends from Ben Lorica.",
    category: "AI",
  },

  // Creators
  {
    url: "https://creatoreconomy.so/feed",
    siteUrl: "https://creatoreconomy.so/",
    title: "Creator Economy",
    description: "Data-forward creator and publishing trends.",
    category: "Creators",
  },
  {
    url: "https://newsletter.systemsapproach.org/feed",
    siteUrl: "https://newsletter.systemsapproach.org/",
    title: "The Systems Approach",
    description: "Essays on creator habits and workflow.",
    category: "Creators",
  },
  {
    url: "https://newsletter.justinwelsh.me/feed",
    siteUrl: "https://newsletter.justinwelsh.me/",
    title: "The Saturday Solopreneur",
    description: "Justin Welsh on solo creator businesses.",
    category: "Creators",
  },
  {
    url: "https://every.to/feed",
    siteUrl: "https://every.to/",
    title: "Every",
    description: "A bundle of business and tech writers.",
    category: "Creators",
  },
  {
    url: "https://on.substack.com/feed",
    siteUrl: "https://on.substack.com/",
    title: "On Substack",
    description: "Substack's own notes on writing and publishing.",
    category: "Creators",
  },
  {
    url: "https://www.thetilt.com/feed/",
    siteUrl: "https://www.thetilt.com/",
    title: "The Tilt",
    description: "Content entrepreneur strategy and case studies.",
    category: "Creators",
  },
  {
    url: "https://li.substack.com/feed",
    siteUrl: "https://li.substack.com/",
    title: "Li's Newsletter",
    description: "Li Jin on creators, platforms, and passion economy.",
    category: "Creators",
  },
  {
    url: "https://trapital.co/feed/",
    siteUrl: "https://trapital.co/",
    title: "Trapital",
    description: "Dan Runcie on music, culture, and the creator biz.",
    category: "Creators",
  },
  {
    url: "https://workweek.com/feed/",
    siteUrl: "https://workweek.com/",
    title: "Workweek",
    description: "A network of creator-led business newsletters.",
    category: "Creators",
  },
  {
    url: "https://blog.convertkit.com/feed/",
    siteUrl: "https://blog.convertkit.com/",
    title: "ConvertKit Blog",
    description: "Creator growth, email, and monetization craft.",
    category: "Creators",
  },

  // Business
  {
    url: "https://stratechery.com/feed",
    siteUrl: "https://stratechery.com/",
    title: "Stratechery",
    description: "Ben Thompson on tech strategy.",
    category: "Business",
  },
  {
    url: "https://hbr.org/rss",
    siteUrl: "https://hbr.org/",
    title: "Harvard Business Review",
    description: "HBR articles across leadership and strategy.",
    category: "Business",
  },
  {
    url: "https://a16z.com/feed/",
    siteUrl: "https://a16z.com/",
    title: "Andreessen Horowitz",
    description: "Thesis posts from a16z partners.",
    category: "Business",
  },
  {
    url: "https://www.notboring.co/feed",
    siteUrl: "https://www.notboring.co/",
    title: "Not Boring",
    description: "Packy McCormick on strategy and narrative.",
    category: "Business",
  },
  {
    url: "https://every.to/divinations/feed",
    siteUrl: "https://every.to/divinations",
    title: "Divinations",
    description: "Strategy essays from Nathan Baschez.",
    category: "Business",
  },
  {
    url: "https://www.generalist.com/feed",
    siteUrl: "https://www.generalist.com/",
    title: "The Generalist",
    description: "Mario Gabriele on companies and investors.",
    category: "Business",
  },
  {
    url: "https://www.morningbrew.com/feed",
    siteUrl: "https://www.morningbrew.com/",
    title: "Morning Brew",
    description: "Daily business news, read in five minutes.",
    category: "Business",
  },
  {
    url: "https://diff.substack.com/feed",
    siteUrl: "https://diff.substack.com/",
    title: "The Diff",
    description: "Byrne Hobart on markets and technology.",
    category: "Business",
  },
  {
    url: "https://www.ben-evans.com/benedictevans?format=rss",
    siteUrl: "https://www.ben-evans.com/",
    title: "Benedict Evans",
    description: "Analyst notes on tech, mobile, and media.",
    category: "Business",
  },
  {
    url: "https://noahpinion.substack.com/feed",
    siteUrl: "https://noahpinion.substack.com/",
    title: "Noahpinion",
    description: "Noah Smith on economics and technology.",
    category: "Business",
  },
];

export function catalogByCategory(): Record<CuratedCategory, CuratedFeed[]> {
  const out = {} as Record<CuratedCategory, CuratedFeed[]>;
  for (const c of CURATED_CATEGORIES) out[c] = [];
  for (const f of CURATED_FEEDS) {
    const cat = f.category as CuratedCategory;
    (out[cat] ??= []).push(f);
  }
  return out;
}
