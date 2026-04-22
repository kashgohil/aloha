export type NormalizedComment = {
  remoteId: string;
  parentRemoteId: string;
  rootRemoteId: string;
  authorDid: string | null;
  authorHandle: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  content: string;
  platformData: Record<string, unknown>;
  platformCreatedAt: Date;
};

export type CommentsFetchResult = {
  comments: NormalizedComment[];
  newCursor: string | null;
};
