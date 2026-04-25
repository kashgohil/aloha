export type RedditPostingMeta = {
  subreddit: string;
  flairId: string;
  flairText: string;
  nsfw: boolean;
  spoiler: boolean;
};

export function readRedditMeta(
  payload: Record<string, unknown>,
): RedditPostingMeta {
  return {
    subreddit: typeof payload.subreddit === "string" ? payload.subreddit : "",
    flairId: typeof payload.flairId === "string" ? payload.flairId : "",
    flairText: typeof payload.flairText === "string" ? payload.flairText : "",
    nsfw: payload.nsfw === true,
    spoiler: payload.spoiler === true,
  };
}
