// Detects post content that reads like an outline placeholder rather than a
// finished, publishable line. A LinkedIn post once shipped with the body
// "1. Slide 1\n2. Slide 2\n…" because the AI returned literal slide labels
// for keyPoints — we catch that here both at parse time (reject + retry) and
// at publish time (refuse to ship, surface a clear error).

const LABEL_ONLY = /^(slide|tweet|page|panel|step|point|part|chapter|section|frame|card|hook|cta|headline|title|intro|outro|closing|opening)\s*\d*\s*[:\-–—]?\s*$/i;

const LABELLED_PREFIX = /^(slide|tweet|page|panel|step|point|part|chapter|section|frame|card)\s+\d+\s*[:\-–—]\s*$/i;

const META_PLACEHOLDER = /^(insert|placeholder|tbd|todo|fill in|coming soon|lorem ipsum|content here|text here|copy here)\b/i;

const BRACKET_PLACEHOLDER = /\[[^\]]{2,40}\]/;

const TEMPLATE_VAR = /\{\{[^}]+\}\}/;

// Strip the "1. " / "2) " numbering composeBeatBody adds for thread/carousel
// formats so we can evaluate the underlying line on its own merits.
function stripBulletPrefix(line: string): string {
  return line.replace(/^\s*\d+\s*[.)\-–:]\s+/, "").trim();
}

export function isPlaceholderLine(raw: string): boolean {
  const line = stripBulletPrefix(raw).trim();
  if (!line) return false;
  if (TEMPLATE_VAR.test(line)) return true;
  if (BRACKET_PLACEHOLDER.test(line)) return true;
  if (META_PLACEHOLDER.test(line)) return true;
  if (LABEL_ONLY.test(line)) return true;
  if (LABELLED_PREFIX.test(line)) return true;
  return false;
}

// True if any keyPoint reads like a placeholder. Use at parse time to reject
// AI output that fell into outline-mode instead of writing real copy.
export function hasPlaceholderKeyPoint(keyPoints: readonly string[]): boolean {
  return keyPoints.some(isPlaceholderLine);
}

// Scans a full post body (multiline) and returns the first placeholder line
// found, or null if the body is clean. Use at publish time as a safety net.
export function findPlaceholderInBody(body: string): string | null {
  for (const line of body.split(/\r?\n/)) {
    if (isPlaceholderLine(line)) return line.trim();
  }
  return null;
}
