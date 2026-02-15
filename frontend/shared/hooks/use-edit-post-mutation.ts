import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/shared/lib/axios";

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
    onSuccess: (_: any, variables: EditPostVariables) => {
      // Invalidate relevant queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["liked-posts"] });
    },
  });
}
