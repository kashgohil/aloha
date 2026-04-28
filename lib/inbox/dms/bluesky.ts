import {
  createSession,
  getBlueskyCredentials,
} from "@/lib/publishers/bluesky";
import type { NormalizedMessage, SyncResult } from "../types";
import { upsertThreadProfiles, type ThreadProfile } from "./_thread-profiles";

// Bluesky DMs live on a separate chat service reachable via an atproto
// proxy. The regular agent session works as long as the app password was
// created with the "Direct messages" permission granted. Without that
// permission, listConvos returns a 401 and this fetcher will throw the
// error up through syncInbox (which logs + creates a user notification).

const PAGE_SIZE = 50;

type ConvoView = {
  id: string;
  rev: string;
  members: Array<{
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
  }>;
  lastMessage?: unknown;
  unreadCount?: number;
};

type MessageView = {
  id: string;
  rev: string;
  text: string;
  sender: { did: string };
  sentAt: string;
};

export async function fetchBlueskyDms(
  workspaceId: string,
  cursor: string | null,
): Promise<SyncResult> {
  const credentials = await getBlueskyCredentials(workspaceId);
  const agent = await createSession(credentials);
  const chatAgent = agent.withProxy("bsky_chat", "did:web:api.bsky.chat");

  // Older credential rows may not have did stamped. After login the agent
  // session has it authoritatively — prefer that.
  const selfDid =
    (agent as unknown as { session?: { did?: string } }).session?.did ??
    credentials.did ??
    "";
  if (!selfDid) {
    throw new Error("Could not resolve Bluesky DID for session");
  }

  const messages: NormalizedMessage[] = [];
  const threadProfiles: ThreadProfile[] = [];

  // listConvos is paginated by cursor. We page through convos once per
  // sync; for each one we fetch the latest window of messages. A fancier
  // implementation would remember per-convo cursors separately, but a
  // flat cursor across all convos is fine for the first cut — the
  // per-message unique index in inbox_messages absorbs overlap cheaply.
  const convoRes = await (
    chatAgent as unknown as {
      chat: {
        bsky: {
          convo: {
            listConvos: (args: {
              limit?: number;
              cursor?: string;
            }) => Promise<{
              data: { convos?: ConvoView[]; cursor?: string };
            }>;
            getMessages: (args: {
              convoId: string;
              limit?: number;
            }) => Promise<{
              data: { messages?: MessageView[] };
            }>;
          };
        };
      };
    }
  ).chat.bsky.convo.listConvos({
    limit: PAGE_SIZE,
    cursor: cursor ?? undefined,
  });

  const convos = convoRes.data.convos ?? [];
  const newCursor = convoRes.data.cursor ?? null;

  for (const convo of convos) {
    const other = convo.members.find((m) => m.did !== selfDid);

    if (other) {
      threadProfiles.push({
        threadId: convo.id,
        counterpartyId: other.did,
        counterpartyHandle: other.handle,
        counterpartyDisplayName: other.displayName ?? null,
        counterpartyAvatarUrl: other.avatar ?? null,
      });
    }

    const msgRes = await (
      chatAgent as unknown as {
        chat: {
          bsky: {
            convo: {
              getMessages: (args: {
                convoId: string;
                limit?: number;
              }) => Promise<{ data: { messages?: MessageView[] } }>;
            };
          };
        };
      }
    ).chat.bsky.convo.getMessages({ convoId: convo.id, limit: PAGE_SIZE });

    for (const m of msgRes.data.messages ?? []) {
      const outbound = m.sender.did === selfDid;
      const author = outbound
        ? {
            did: selfDid,
            handle: credentials.handle,
            displayName: null,
            avatar: null,
          }
        : {
            did: other?.did ?? m.sender.did,
            handle: other?.handle ?? m.sender.did,
            displayName: other?.displayName ?? null,
            avatar: other?.avatar ?? null,
          };

      messages.push({
        remoteId: m.id,
        threadId: convo.id,
        parentId: null,
        reason: "dm",
        direction: outbound ? "out" : "in",
        authorDid: author.did,
        authorHandle: author.handle,
        authorDisplayName: author.displayName,
        authorAvatarUrl: author.avatar,
        content: m.text,
        platformData: { convoId: convo.id, rev: m.rev },
        platformCreatedAt: new Date(m.sentAt),
      });
    }
  }

  await upsertThreadProfiles(workspaceId, "bluesky", threadProfiles);

  return { messages, comments: [], newCursor };
}
