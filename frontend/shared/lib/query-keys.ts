export interface FeedParams {
  limit?: number;
  authorId?: string;
  filterType?: string;
  isLikedFeed?: boolean;
}

export const QUERY_KEYS = {
  feed: (params: FeedParams) => ["feed", params] as const,
  user: (username: string) => ["user", username] as const,
  thread: (id: string, sort?: string) => ["thread", id, sort] as const,
};
