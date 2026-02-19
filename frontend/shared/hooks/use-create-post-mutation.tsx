import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postService } from "@/services/post.service";
import { CreatePostDTO } from "@/shared/types/post-dto";
import { toast } from "sonner";

/**
 * Hook for creating new posts with optimistic updates.
 * Uses cache-updates utilities for rollback.
 */
export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();
  

  return useMutation({
    mutationFn: (data: CreatePostDTO) => postService.createPost(data),
    onMutate: async (newPostDTO) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      await queryClient.cancelQueries({ queryKey: ["thread"] });
      const toastId = !newPostDTO.suppressToast ? toast.loading("Posting...") : undefined;

      return {
        previousFeeds: undefined,
        previousThreads: undefined,
        toastId,
      };
    },
    onSuccess: (responseData, variables, context) => {
      const newPost = responseData.post;
      if (!variables.suppressToast) {
        toast.success(
          <div className="flex w-full items-center justify-between gap-2 min-w-[300px]">
            <span className="truncate">Posted</span>
            <span 
              className="font-bold cursor-pointer hover:underline text-sm shrink-0"
              onClick={() => {
                window.location.href = `/posts/${newPost._id}/thread`;
              }}
            >
              View
            </span>
          </div>, 
          { id: context.toastId, duration: 5000 }
        );
      } else if (context.toastId) {
        toast.dismiss(context.toastId);
      }

      // Invalidate relevant queries to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["thread"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
    },
    onError: (err: any, variables, context) => {
      if (!variables.suppressToast) {
        toast.error(err.response?.data?.message || "Failed to post", {
          id: context?.toastId,
        });
      } else if (context?.toastId) {
        toast.dismiss(context.toastId);
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
