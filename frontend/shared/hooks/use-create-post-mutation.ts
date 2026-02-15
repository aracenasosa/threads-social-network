import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { postService } from "@/services/post.service";
import { useAuthStore } from "@/store/auth.store";
import { CreatePostDTO } from "@/shared/types/post-dto";
import { FeedResponse } from "@/shared/types/post.types";
import { rollbackFeedCaches, FeedSnapshot } from "@/shared/lib/cache-updates";

/**
 * Hook for creating new posts with optimistic updates.
 * Uses cache-updates utilities for rollback.
 */
export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (data: CreatePostDTO) => postService.createPost(data),
    onMutate: async (newPostDTO): Promise<{ previousFeeds: FeedSnapshot }> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["feed"] });

      // Snapshot previous feeds for rollback
      const previousFeeds = queryClient.getQueriesData<
        InfiniteData<FeedResponse>
      >({ queryKey: ["feed"] });

      // Create a temporary optimistic post object
      const optimisticPost: any = {
        _id: `temp-${Date.now()}`,
        text: newPostDTO.text,
        author: {
          _id: user?.id || newPostDTO.author,
          userName: user?.userName || "you",
          fullName: user?.fullName || "You",
          avatarUrl: user?.avatarUrl || "",
        },
        media: [],
        likesCount: 0,
        repliesCount: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
      };

      // Optimistically prepend to feeds (Page 1)
      queryClient.setQueriesData<InfiniteData<FeedResponse>>(
        { queryKey: ["feed"] },
        (oldData) => {
          if (!oldData || oldData.pages.length === 0) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page, index) =>
              index === 0
                ? { ...page, items: [optimisticPost, ...page.items] }
                : page,
            ),
          };
        },
      );

      return { previousFeeds };
    },
    onSuccess: (responseData, variables) => {
      const newPost = responseData.post;

      // Replace optimistic post with real one
      queryClient.setQueriesData<InfiniteData<FeedResponse>>(
        { queryKey: ["feed"] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item._id.startsWith("temp-") && item.text === newPost.text
                  ? newPost
                  : item,
              ),
            })),
          };
        },
      );

      // If it's a thread reply, invalidate the thread
      if (variables.parentPost) {
        queryClient.invalidateQueries({
          queryKey: ["thread", variables.parentPost],
        });
      }
    },
    onError: (_err, _newPostDTO, context) => {
      // Rollback using utility
      if (context?.previousFeeds) {
        rollbackFeedCaches(queryClient, context.previousFeeds);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["feed"],
        refetchType: "none",
      });
    },
  });
};
