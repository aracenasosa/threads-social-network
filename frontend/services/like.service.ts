import apiClient from "@/shared/lib/axios";

export const likeService = {
  toggleLike: async (postId: string) => {
    const { data } = await apiClient.post<{
      message: string;
      liked: boolean;
      likesCount: number;
    }>(`/likes/${postId}/toggle`, {});
    return data;
  },
};
