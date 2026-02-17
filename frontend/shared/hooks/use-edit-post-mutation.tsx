import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { postService } from "@/services/post.service";
import { toast } from "sonner";

interface EditPostVariables {
  postId: string;
  text: string;
}

export function useEditPostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, text }: EditPostVariables) => {
      // Use postService
      const { user } = await import("@/store/auth.store").then((m) =>
        m.useAuthStore.getState(),
      );
      // Actually postService doesn't need auth store, axios interceptor handles token.
      return postService.updatePost(postId, text);
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      await queryClient.cancelQueries({ queryKey: ["thread"] });
      const toastId = toast.loading("Editing...");
      return {
        previousFeeds: undefined,
        previousThreads: undefined,
        toastId,
      };
    },
    onSuccess: (_, variables, context) => {
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
