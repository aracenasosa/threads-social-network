import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { postService } from "@/services/post.service";
import { toast } from "sonner";
import { Post, FeedResponse } from "@/shared/types/post.types";
import { rollbackFeedCaches, FeedSnapshot } from "@/shared/lib/cache-updates";

import { useRouter, useParams } from "next/navigation";

export function useDeletePostMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();

  return useMutation({
    mutationFn: async (postId: string) => {
      return postService.deletePost(postId);
    },
    onMutate: async (postId: string) => {
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

      // Find the post to know if it's a reply and who is the parent
      let parentPostId: string | null | undefined = null;

      // Look in Feed
      previousFeeds.some(([_key, data]) => {
        const item = data?.pages
          .flatMap((p) => p.items)
          .find((i) => i._id === postId);
        if (item) {
          parentPostId = item.parentPost;
          return true;
        }
        return false;
      });

      // If not in feed, look in Thread
      if (parentPostId === null) {
        previousThreads.some(([_key, data]) => {
          if (data?._id === postId) {
            parentPostId = data.parentPost;
            return true;
          }
          const reply = data?.replies?.find((r) => r._id === postId);
          if (reply) {
            parentPostId = reply.parentPost;
            return true;
          }
          return false;
        });
      }

      // Optimistically update Feed
      queryClient.setQueriesData<InfiniteData<FeedResponse>>(
        { queryKey: ["feed"] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items
                .filter((item) => item._id !== postId)
                .map((item) =>
                  item._id === parentPostId
                    ? {
                        ...item,
                        repliesCount: Math.max(0, (item.repliesCount || 0) - 1),
                      }
                    : item,
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

          // If the deleted post is the root post of the thread
          if (oldThread._id === postId) {
            return undefined; // This will effectively "clear" the thread view or make it empty
          }

          // If it's a reply in the current thread
          return {
            ...oldThread,
            replies: (oldThread.replies || []).filter(
              (reply) => reply._id !== postId,
            ),
            repliesCount:
              oldThread._id === parentPostId
                ? Math.max(0, (oldThread.repliesCount || 0) - 1)
                : oldThread.repliesCount,
          };
        },
      );

      const toastId = toast.loading("Deleting...");
      return { toastId, previousFeeds, previousThreads };
    },
    onSuccess: (_, postId, context) => {
      toast.success("Deleted", { id: context.toastId });
      // Invalidate all post-related queries
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["thread"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["liked-posts"] });

      // Redirect to feed if we are on the deleted post's page
      if (params.id === postId) {
        router.push("/feed");
      }
    },
    onError: (err: any, _variables, context) => {
      toast.error(err.response?.data?.message || "Failed to delete post", {
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
