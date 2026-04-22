// One capture from a platform's metrics endpoint. Every metric is optional
// because platform support varies — e.g. Bluesky has no impressions, X has
// everything, LinkedIn exposes only likes + comments on the scopes we hold.
export type NormalizedSnapshot = {
  likes: number | null;
  reposts: number | null;
  replies: number | null;
  views: number | null;
  bookmarks: number | null;
  profileClicks: number | null;
};

export const EMPTY_SNAPSHOT: NormalizedSnapshot = {
  likes: null,
  reposts: null,
  replies: null,
  views: null,
  bookmarks: null,
  profileClicks: null,
};
