import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { likeService } from "@/services/like.service";
import { QUERY_KEYS } from "@/shared/lib/query-keys";
import { Post, FeedResponse } from "@/shared/types/post.types";

export const useLikeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => likeService.toggleLike(postId),
    onMutate: async (postId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      await queryClient.cancelQueries({ queryKey: ["thread"] });

      // Snapshot the previous value
      const previousFeeds = queryClient.getQueriesData<
        InfiniteData<FeedResponse>
      >({ queryKey: ["feed"] });
      const previousThreads = queryClient.getQueriesData<Post>({
        queryKey: ["thread"],
      });

      // Optimistically update all feeds that might contain this post
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
                      isLiked: !post.isLiked,
                      likesCount: post.isLiked
                        ? post.likesCount - 1
                        : post.likesCount + 1,
                    }
                  : post,
              ),
            })),
          };
        },
      );

      // Optimistically update any active thread queries
      queryClient.setQueriesData<Post>({ queryKey: ["thread"] }, (oldPost) => {
        if (!oldPost) return oldPost;

        // If the thread itself is the liked post
        if (oldPost._id === postId) {
          return {
            ...oldPost,
            isLiked: !oldPost.isLiked,
            likesCount: oldPost.isLiked
              ? oldPost.likesCount - 1
              : oldPost.likesCount + 1,
          };
        }

        // If the liked post is a reply in the current thread
        if (oldPost.replies) {
          return {
            ...oldPost,
            replies: oldPost.replies.map((reply) =>
              reply._id === postId
                ? {
                    ...reply,
                    isLiked: !reply.isLiked,
                    likesCount: reply.isLiked
                      ? reply.likesCount - 1
                      : reply.likesCount + 1,
                  }
                : reply,
            ),
          };
        }

        return oldPost;
      });

      return { previousFeeds, previousThreads };
    },
    onSuccess: (data, postId) => {
      // Patch authoritative data from server
      const { liked, likesCount } = data;

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
                  ? { ...post, isLiked: liked, likesCount }
                  : post,
              ),
            })),
          };
        },
      );

      queryClient.setQueriesData<Post>({ queryKey: ["thread"] }, (oldPost) => {
        if (!oldPost) return oldPost;
        if (oldPost._id === postId) {
          return { ...oldPost, isLiked: liked, likesCount };
        }

        if (oldPost.replies) {
          return {
            ...oldPost,
            replies: oldPost.replies.map((reply) =>
              reply._id === postId
                ? { ...reply, isLiked: liked, likesCount }
                : reply,
            ),
          };
        }
        return oldPost;
      });
    },
    onError: (err, postId, context) => {
      // Rollback to snapshots
      if (context?.previousFeeds) {
        context.previousFeeds.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousThreads) {
        context.previousThreads.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (data, error, postId) => {
      // Refetch to sync, but we already patched so it's transparent
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["thread", postId] });
    },
  });
};
