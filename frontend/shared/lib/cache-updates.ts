import { InfiniteData, QueryClient } from "@tanstack/react-query";
import { Post, FeedResponse } from "@/shared/types/post.types";

/**
 * Cache update utilities for TanStack Query.
 * Follows Single Responsibility Principle by separating cache update logic
 * from mutation hooks.
 */

/** Type for partial post updates */
export type PostUpdate = Partial<
  Pick<Post, "isLiked" | "likesCount" | "repliesCount">
>;

/** Type for snapshot of feed queries (used for rollback) */
export type FeedSnapshot = [
  readonly unknown[],
  InfiniteData<FeedResponse> | undefined,
][];

/** Type for snapshot of thread queries (used for rollback) */
export type ThreadSnapshot = [readonly unknown[], Post | undefined][];

/**
 * Updates a post in all feed caches.
 *
 * @param queryClient - TanStack Query client
 * @param postId - ID of the post to update
 * @param updates - Partial post updates to apply
 */
export function updatePostInFeedCache(
  queryClient: QueryClient,
  postId: string,
  updates: PostUpdate | ((post: Post) => PostUpdate),
): void {
  queryClient.setQueriesData<InfiniteData<FeedResponse>>(
    { queryKey: ["feed"] },
    (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          items: page.items.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  ...(typeof updates === "function" ? updates(post) : updates),
                }
              : post,
          ),
        })),
      };
    },
  );
}

/**
 * Updates a post or reply in all thread caches.
 *
 * @param queryClient - TanStack Query client
 * @param postId - ID of the post to update
 * @param updates - Partial post updates to apply
 */
export function updatePostInThreadCache(
  queryClient: QueryClient,
  postId: string,
  updates: PostUpdate | ((post: Post) => PostUpdate),
): void {
  queryClient.setQueriesData<Post>({ queryKey: ["thread"] }, (oldPost) => {
    if (!oldPost) return oldPost;

    const applyUpdates = (post: Post): Post => ({
      ...post,
      ...(typeof updates === "function" ? updates(post) : updates),
    });

    // If the thread itself is the liked post
    if (oldPost._id === postId) {
      return applyUpdates(oldPost);
    }

    // If the liked post is a reply in the current thread
    if (oldPost.replies) {
      return {
        ...oldPost,
        replies: oldPost.replies.map((reply) =>
          reply._id === postId ? applyUpdates(reply) : reply,
        ),
      };
    }

    return oldPost;
  });
}

/**
 * Captures snapshots of all feed and thread caches for rollback.
 *
 * @param queryClient - TanStack Query client
 * @returns Object containing feed and thread snapshots
 */
export async function captureQuerySnapshots(
  queryClient: QueryClient,
): Promise<{ previousFeeds: FeedSnapshot; previousThreads: ThreadSnapshot }> {
  await queryClient.cancelQueries({ queryKey: ["feed"] });
  await queryClient.cancelQueries({ queryKey: ["thread"] });

  const previousFeeds = queryClient.getQueriesData<InfiniteData<FeedResponse>>({
    queryKey: ["feed"],
  });
  const previousThreads = queryClient.getQueriesData<Post>({
    queryKey: ["thread"],
  });

  return { previousFeeds, previousThreads };
}

/**
 * Restores feed caches from a snapshot.
 *
 * @param queryClient - TanStack Query client
 * @param snapshot - Feed snapshot to restore
 */
export function rollbackFeedCaches(
  queryClient: QueryClient,
  snapshot: FeedSnapshot,
): void {
  snapshot.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
}

/**
 * Restores thread caches from a snapshot.
 *
 * @param queryClient - TanStack Query client
 * @param snapshot - Thread snapshot to restore
 */
export function rollbackThreadCaches(
  queryClient: QueryClient,
  snapshot: ThreadSnapshot,
): void {
  snapshot.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
}

/**
 * Invalidates feed and optionally thread queries.
 *
 * @param queryClient - TanStack Query client
 * @param threadId - Optional thread ID to invalidate
 */
export function invalidateFeedAndThread(
  queryClient: QueryClient,
  threadId?: string,
): void {
  queryClient.invalidateQueries({ queryKey: ["feed"] });
  if (threadId) {
    queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
  }
}
