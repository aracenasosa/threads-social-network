import apiClient from "@/shared/lib/axios";
import { LIKE_TOGGLE_ENDPOINT } from "@/shared/constants/url";

export const likeService = {
  toggleLike: async (postId: string) => {
    const { data } = await apiClient.post<{
      message: string;
      liked: boolean;
      likesCount: number;
    }>(LIKE_TOGGLE_ENDPOINT(postId), {});
    return data;
  },
};
