import {
  getBlueskyCredentials,
  createSession,
} from "@/lib/publishers/bluesky";
import { getFreshToken, forceRefresh } from "@/lib/publishers/tokens";

type ReplyResult = {
  remoteId: string;
  remoteUrl: string;
};

export async function replyOnBluesky(
  userId: string,
  parentUri: string,
  parentCid: string,
  rootUri: string,
  text: string,
): Promise<ReplyResult> {
  const credentials = await getBlueskyCredentials(userId);
  const agent = await createSession(credentials);

  let rootCid = parentCid;
  if (rootUri !== parentUri) {
    const thread = await agent.getPostThread({ uri: rootUri, depth: 0 });
    const post = thread.data.thread as { post?: { cid?: string } };
    rootCid = post?.post?.cid ?? parentCid;
  }

  const result = await agent.post({
    text,
    reply: {
      root: { uri: rootUri, cid: rootCid },
      parent: { uri: parentUri, cid: parentCid },
    },
  });

  const rkey = result.uri.split("/").pop() ?? result.uri;

  return {
    remoteId: result.uri,
    remoteUrl: `https://bsky.app/profile/${credentials.handle}/post/${rkey}`,
  };
}

export async function replyOnX(
  userId: string,
  inReplyToTweetId: string,
  text: string,
): Promise<ReplyResult> {
  let account = await getFreshToken(userId, "twitter");

  async function postReply(accessToken: string): Promise<Response> {
    return fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        reply: { in_reply_to_tweet_id: inReplyToTweetId },
      }),
    });
  }

  let res = await postReply(account.accessToken);

  if (res.status === 401) {
    account = await forceRefresh(userId, "twitter");
    res = await postReply(account.accessToken);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`X reply failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as { data?: { id?: string } } | null;
  const tweetId = json?.data?.id;
  if (!tweetId) throw new Error("X reply returned no tweet id");

  return {
    remoteId: tweetId,
    remoteUrl: `https://x.com/i/web/status/${tweetId}`,
  };
}
