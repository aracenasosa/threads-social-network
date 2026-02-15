import { create } from "zustand";
import apiClient from "@/shared/lib/axios";
import { userService } from "@/services/user.service";
import axios from "axios";
import {
  setAccessToken,
  removeAccessToken,
  getAccessToken,
} from "@/shared/lib/token";
import { decodeToken, isTokenExpired } from "@/shared/lib/jwt";
import {
  UserProfile,
  LoginCredentials,
  SignupData,
  AuthResponse,
  RefreshTokenResponse,
} from "@/shared/types/auth.types";
import {
  API_BASE_URL,
  AUTH_LOGIN_ENDPOINT,
  AUTH_REGISTER_ENDPOINT,
  AUTH_LOGOUT_ENDPOINT,
  AUTH_REFRESH_ENDPOINT,
  AUTH_GOOGLE_ENDPOINT,
} from "@/shared/constants/url";

export type AuthStatus = "idle" | "checking" | "authenticated" | "guest";

interface AuthState {
  user: UserProfile | null;
  status: AuthStatus;
  isLoading: boolean; // Keep for backward compatibility or remove if unused, but status replaces its main purpose
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithGoogle: (code: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",
  isLoading: false,
  error: null,

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });

      const { data } = await apiClient.post<AuthResponse>(
        AUTH_LOGIN_ENDPOINT,
        credentials,
      );

      // Store access token
      setAccessToken(data.accessToken);

      // Convert LoginUser to UserProfile format
      const userProfile: UserProfile | null = data.user
        ? {
            id: data.user.id,
            fullName: data.user.fullName,
            userName: data.user.userName,
            email: data.user.email,
            avatarUrl: undefined, // Will be fetched if needed
          }
        : null;

      // Update auth state
      set({
        user: userProfile,
        status: "authenticated",
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Login failed";
      set({
        error: errorMessage,
        isLoading: false,
        status: "guest",
      });
      return false;
    }
  },

  loginWithGoogle: async (code: string) => {
    try {
      set({ isLoading: true, error: null });

      const { data } = await apiClient.post<AuthResponse>(
        AUTH_GOOGLE_ENDPOINT,
        { code },
      );

      // Store access token
      setAccessToken(data.accessToken);

      // Convert LoginUser to UserProfile format
      const userProfile: UserProfile | null = data.user
        ? {
            id: data.user.id,
            fullName: data.user.fullName,
            userName: data.user.userName,
            email: data.user.email,
            avatarUrl: data.user.avatarUrl,
          }
        : null;

      // Update auth state
      set({
        user: userProfile,
        status: "authenticated",
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Google login failed";
      set({
        error: errorMessage,
        isLoading: false,
        status: "guest",
      });
      return false;
    }
  },

  signup: async (data: SignupData) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.post<AuthResponse>(
        AUTH_REGISTER_ENDPOINT,
        data,
      );

      // If signup returns token, auto-login
      if (response.data.accessToken) {
        setAccessToken(response.data.accessToken);

        // Convert LoginUser to UserProfile format
        const userProfile: UserProfile | null = response.data.user
          ? {
              id: response.data.user.id,
              fullName: response.data.user.fullName,
              userName: response.data.user.userName,
              email: response.data.user.email,
              avatarUrl: undefined, // Will be fetched if needed
            }
          : null;

        set({
          user: userProfile,
          status: "authenticated",
          isLoading: false,
        });
        return true;
      } else {
        set({ isLoading: false });
        return true;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Signup failed";
      set({
        error: errorMessage,
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    try {
      // Call logout endpoint to clear refresh token cookie
      await apiClient.post(AUTH_LOGOUT_ENDPOINT);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear TanStack Query cache to remove all user-specific data
      // This is important to prevent data leaking between users or after logout
      try {
        const { useQueryClient } = await import("@tanstack/react-query");
        // Note: queryClient is usually accessed via a hook,
        // but for the store, we might need a workaround or accept that
        // the hard redirect handles most cases.
        // For a more robust approach in Next.js, a hard reload is often safest.
      } catch (e) {}

      // Clear local state regardless of API call result
      removeAccessToken();
      set({
        user: null,
        status: "guest",
      });

      // Redirect to login handled by AuthProvider or component
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  },

  setUser: (user: UserProfile | null) => {
    set({ user, status: user ? "authenticated" : "guest" });
  },

  checkAuth: async () => {
    const currentState = get();

    // 1. Guard: If already checking, return
    if (currentState.status === "checking") return;

    const currentToken = getAccessToken();

    // 2. If we have a user and they match the token, and we're not idle, we're good
    if (currentState.user && currentToken && !isTokenExpired(currentToken)) {
      if (currentState.status !== "authenticated") {
        set({ status: "authenticated" });
      }
      return;
    }

    set({ status: "checking" });

    // 3. If token exists, try to fetch user.
    // The axios interceptor will handle 401/refresh automatically if it's expired.
    if (currentToken) {
      try {
        const payload = decodeToken(currentToken);
        if (payload?.userId) {
          const { user } = await userService.getUserById(payload.userId);
          set({ user, status: "authenticated" });
          return;
        }
      } catch (error) {
        console.error("CheckAuth error (with token):", error);
        // If it failed despite having a token, the interceptor likely couldn't refresh either
        set({ user: null, status: "guest" });
        removeAccessToken();
        return;
      }
    }

    // 4. If NO token, try to refresh once from cookie to restore session
    try {
      // Use raw axios to avoid interceptor complexity for this specific boot-up check
      const { data } = await axios.post<RefreshTokenResponse>(
        `${API_BASE_URL}${AUTH_REFRESH_ENDPOINT}`,
        {},
        { withCredentials: true },
      );

      const newToken = data.accessToken;
      setAccessToken(newToken);

      const payload = decodeToken(newToken);
      if (payload?.userId) {
        const { user } = await userService.getUserById(payload.userId);
        set({ user, status: "authenticated" });
      } else {
        set({ status: "authenticated" });
      }
    } catch (error) {
      // Refresh failed (no cookie or expired) - user is a guest
      set({ status: "guest", user: null });
      removeAccessToken();
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
