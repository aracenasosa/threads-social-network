import apiClient from "@/shared/lib/axios";
import { UserProfile } from "@/shared/types/auth.types";
import {
  USER_BY_ID_ENDPOINT,
  USER_BY_USERNAME_ENDPOINT,
  USER_SEARCH_ENDPOINT,
} from "@/shared/constants/url";

export const userService = {
  getUserById: async (userId: string) => {
    const { data } = await apiClient.get<{ user: UserProfile }>(
      USER_BY_ID_ENDPOINT(userId),
    );
    return data;
  },

  getUserByUsername: async (username: string) => {
    const { data } = await apiClient.get<{ user: UserProfile }>(
      USER_BY_USERNAME_ENDPOINT(username),
    );
    return data;
  },

  searchUsers: async (query: string) => {
    const { data } = await apiClient.get<{ users: UserProfile[] }>(
      USER_SEARCH_ENDPOINT,
      { params: { q: query } },
    );
    return data;
  },
};
