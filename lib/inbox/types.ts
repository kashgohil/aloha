export type NormalizedMessage = {
  remoteId: string;
  threadId: string | null;
  parentId: string | null;
  reason: "mention" | "reply";
  authorDid: string;
  authorHandle: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  content: string;
  platformData: Record<string, unknown>;
  platformCreatedAt: Date;
};

export type SyncResult = {
  messages: NormalizedMessage[];
  newCursor: string | null;
};
