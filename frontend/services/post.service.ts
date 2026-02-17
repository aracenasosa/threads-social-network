import apiClient from "@/shared/lib/axios";
import {
  FeedResponse,
  Post,
  CreatePostResponse,
} from "@/shared/types/post.types";
import { CreatePostDTO } from "@/shared/types/post-dto";
import {
  POST_CREATE_ENDPOINT,
  POST_FEED_ENDPOINT,
  POST_LIKED_ENDPOINT,
  POST_THREAD_ENDPOINT,
  POST_BY_ID_ENDPOINT,
} from "@/shared/constants/url";

export const postService = {
  getFeed: async (
    limit: number = 10,
    cursor?: string,
    authorId?: string,
    filterType?: string,
  ) => {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("order", "desc");

    if (cursor) {
      params.append("cursor", cursor);
    }

    if (authorId) {
      params.append("author", authorId);
    }

    if (filterType) {
      params.append("filterType", filterType);
    }

    const { data } = await apiClient.get<FeedResponse>(
      `${POST_FEED_ENDPOINT}?${params.toString()}`,
    );
    return data;
  },

  getThread: async (threadId: string, sort?: "top" | "recent") => {
    const url = sort
      ? `${POST_THREAD_ENDPOINT(threadId)}?sort=${sort}`
      : POST_THREAD_ENDPOINT(threadId);
    const { data } = await apiClient.get<Post>(url);
    return data;
  },

  createPost: async (postData: CreatePostDTO): Promise<CreatePostResponse> => {
    const formData = new FormData();
    formData.append("author", postData.author);
    formData.append("text", postData.text);

    if (postData.parentPost) {
      formData.append("parentPost", postData.parentPost);
    }

    if (postData.media && postData.media.length > 0) {
      postData.media.forEach((file) => {
        formData.append("media", file);
      });
    }
    if (postData.threadIndex !== undefined) {
      formData.append("threadIndex", postData.threadIndex.toString());
    }
    if (postData.threadTotal !== undefined) {
      formData.append("threadTotal", postData.threadTotal.toString());
    }

    const { data } = await apiClient.post<CreatePostResponse>(
      POST_CREATE_ENDPOINT,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return data;
  },

  getLikedPosts: async (limit: number = 10, cursor?: string) => {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("order", "desc");

    if (cursor) {
      params.append("cursor", cursor);
    }

    const { data } = await apiClient.get<FeedResponse>(
      `${POST_LIKED_ENDPOINT}?${params.toString()}`,
    );
    return data;
  },

  updatePost: async (postId: string, text: string) => {
    const { data } = await apiClient.patch(POST_BY_ID_ENDPOINT(postId), {
      text,
    });
    return data;
  },

  deletePost: async (postId: string) => {
    const { data } = await apiClient.delete(POST_BY_ID_ENDPOINT(postId));
    return data;
  },
};
