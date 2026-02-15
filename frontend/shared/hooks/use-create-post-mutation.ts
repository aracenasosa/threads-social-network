import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { postService } from "@/services/post.service";
import { useAuthStore } from "@/store/auth.store";
import { CreatePostDTO } from "@/shared/types/post-dto";
import { FeedResponse, Post } from "@/shared/types/post.types";
import { rollbackFeedCaches, FeedSnapshot } from "@/shared/lib/cache-updates";
import { toast } from "sonner";

/**
 * Hook for creating new posts with optimistic updates.
 * Uses cache-updates utilities for rollback.
 */
export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (data: CreatePostDTO) => postService.createPost(data),
    onMutate: async (
      newPostDTO,
    ): Promise<{
      previousFeeds: FeedSnapshot;
      previousThreads: [readonly unknown[], Post | undefined][];
      toastId: string | number;
    }> => {
      const toastId = toast.loading("Posting...");

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      await queryClient.cancelQueries({ queryKey: ["thread"] });

      // Snapshot previous feeds and threads for rollback
      const previousFeeds = queryClient.getQueriesData<
        InfiniteData<FeedResponse>
      >({ queryKey: ["feed"] });
      const previousThreads = queryClient.getQueriesData<Post>({
        queryKey: ["thread"],
      });

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

      // Optimistically update feeds
      queryClient.setQueriesData<InfiniteData<FeedResponse>>(
        { queryKey: ["feed"] },
        (oldData) => {
          if (!oldData || oldData.pages.length === 0) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page, index) => {
              if (index === 0) {
                // Prepend to feed only if it's a root post (not a reply)
                if (!newPostDTO.parentPost) {
                  return { ...page, items: [optimisticPost, ...page.items] };
                }

                // If it IS a reply, we should find the parent post in the feed
                // and increment its repliesCount
                return {
                  ...page,
                  items: page.items.map((item) =>
                    item._id === newPostDTO.parentPost
                      ? { ...item, repliesCount: (item.repliesCount || 0) + 1 }
                      : item,
                  ),
                };
              }
              return page;
            }),
          };
        },
      );

      // Optimistically add to thread if it's a reply
      if (newPostDTO.parentPost) {
        queryClient.setQueriesData<Post>(
          { queryKey: ["thread", newPostDTO.parentPost] },
          (oldThread) => {
            if (!oldThread) return oldThread;
            return {
              ...oldThread,
              replies: [optimisticPost, ...(oldThread.replies || [])],
              repliesCount: (oldThread.repliesCount || 0) + 1,
            };
          },
        );
      }

      return { previousFeeds, previousThreads, toastId };
    },
    onSuccess: (responseData, variables, context) => {
      const newPost = responseData.post;
      toast.success("Posted", { id: context.toastId });

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

      // If it's a thread reply, replace optimistic reply in thread
      if (variables.parentPost) {
        queryClient.setQueriesData<Post>(
          { queryKey: ["thread", variables.parentPost] },
          (oldThread) => {
            if (!oldThread) return oldThread;
            return {
              ...oldThread,
              replies: (oldThread.replies || []).map((item) =>
                item._id.startsWith("temp-") && item.text === newPost.text
                  ? newPost
                  : item,
              ),
            };
          },
        );

        queryClient.invalidateQueries({
          queryKey: ["thread"],
        });
      }
    },
    onError: (err: any, _newPostDTO, context) => {
      toast.error(err.response?.data?.message || "Failed to post", {
        id: context?.toastId,
      });

      // Rollback using utility
      if (context?.previousFeeds) {
        rollbackFeedCaches(queryClient, context.previousFeeds);
      }
      if (context?.previousThreads) {
        context.previousThreads.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["feed"],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["thread"],
        refetchType: "none",
      });
    },
  });
};
