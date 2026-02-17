import { useMutation, useQueryClient } from "@tanstack/react-query";
import { likeService } from "@/services/like.service";
import { useAuthStore } from "@/store/auth.store";
import { Post } from "@/shared/types/post.types";
import {
  captureQuerySnapshots,
  updatePostInFeedCache,
  updatePostInThreadCache,
  rollbackFeedCaches,
  rollbackThreadCaches,
  invalidateFeedAndThread,
  FeedSnapshot,
  ThreadSnapshot,
} from "@/shared/lib/cache-updates";

/**
 * Hook for managing like/unlike mutations with optimistic updates.
 * Uses cache-updates utilities for DRY cache management.
 */
export const useLikeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => likeService.toggleLike(postId),
    onMutate: async (
      postId,
    ): Promise<{
      previousFeeds: FeedSnapshot;
      previousThreads: ThreadSnapshot;
    }> => {
      // Capture snapshots for potential rollback
      const { previousFeeds, previousThreads } =
        await captureQuerySnapshots(queryClient);

      // Optimistic toggle function - handles optional isLiked and isLikedByAuthor
      const toggleLike = (post: Post, currentUser?: any) => {
        const newIsLiked = !post.isLiked;
        const isAuthor = currentUser?.id === post.threadAuthorId;

        return {
          isLiked: newIsLiked,
          likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
          isLikedByAuthor: isAuthor ? newIsLiked : post.isLikedByAuthor,
          // Ensure we have an avatar URL if they liked it (fallback to current user avatar if they ARE the author)
          authorAvatarUrl:
            isAuthor && newIsLiked
              ? post.authorAvatarUrl || currentUser?.avatarUrl
              : post.authorAvatarUrl,
        };
      };

      // Get current user for optimistic author check
      const currentUser = useAuthStore.getState().user;

      // Optimistically update feeds and threads
      updatePostInFeedCache(queryClient, postId, (post) =>
        toggleLike(post, currentUser),
      );
      updatePostInThreadCache(queryClient, postId, (post) =>
        toggleLike(post, currentUser),
      );

      return { previousFeeds, previousThreads };
    },
    onSuccess: (data, postId) => {
      const { liked, likesCount } = data;

      // Patch authoritative data from server
      const serverUpdates = { isLiked: liked, likesCount };
      updatePostInFeedCache(queryClient, postId, serverUpdates);
      updatePostInThreadCache(queryClient, postId, serverUpdates);
    },
    onError: (_err, _postId, context) => {
      // Rollback on error
      if (context?.previousFeeds) {
        rollbackFeedCaches(queryClient, context.previousFeeds);
      }
      if (context?.previousThreads) {
        rollbackThreadCaches(queryClient, context.previousThreads);
      }
    },
    onSettled: (_data, _error, postId) => {
      // Invalidate to sync with server
      invalidateFeedAndThread(queryClient, postId);
    },
  });
};
