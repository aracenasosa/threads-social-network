import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import apiClient from "@/shared/lib/axios";
import { toast } from "sonner";
import { Post, FeedResponse } from "@/shared/types/post.types";
import { rollbackFeedCaches, FeedSnapshot } from "@/shared/lib/cache-updates";

interface EditPostVariables {
  postId: string;
  text: string;
}

export function useEditPostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, text }: EditPostVariables) => {
      const { data } = await apiClient.patch(`/posts/${postId}`, { text });
      return data;
    },
    onMutate: async ({ postId, text }) => {
      const toastId = toast.loading("Editing...");

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      await queryClient.cancelQueries({ queryKey: ["thread"] });

      // Snapshot caches
      const previousFeeds = queryClient.getQueriesData<
        InfiniteData<FeedResponse>
      >({ queryKey: ["feed"] });
      const previousThreads = queryClient.getQueriesData<Post>({
        queryKey: ["thread"],
      });

      // Optimistically update Feed
      queryClient.setQueriesData<InfiniteData<FeedResponse>>(
        { queryKey: ["feed"] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item._id === postId ? { ...item, text, isEdited: true } : item,
              ),
            })),
          };
        },
      );

      // Optimistically update Thread
      queryClient.setQueriesData<Post>(
        { queryKey: ["thread"] },
        (oldThread) => {
          if (!oldThread) return oldThread;

          // If it's the root post
          if (oldThread._id === postId) {
            return { ...oldThread, text, isEdited: true };
          }

          // If it's a reply
          return {
            ...oldThread,
            replies: (oldThread.replies || []).map((reply) =>
              reply._id === postId ? { ...reply, text, isEdited: true } : reply,
            ),
          };
        },
      );

      return { toastId, previousFeeds, previousThreads };
    },
    onSuccess: (_: any, variables: EditPostVariables, context) => {
      toast.success("Edited", { id: context.toastId });
      // Invalidate relevant queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["thread"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["liked-posts"] });
    },
    onError: (err: any, _variables, context) => {
      toast.error(err.response?.data?.message || "Failed to edit post", {
        id: context?.toastId,
      });

      // Rollback
      if (context?.previousFeeds) {
        rollbackFeedCaches(queryClient, context.previousFeeds as any);
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
}
