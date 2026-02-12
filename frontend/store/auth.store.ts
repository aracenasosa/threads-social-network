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
      // Clear local state regardless of API call result
      removeAccessToken();
      set({
        user: null,
        status: "guest",
        isAuthenticated: false, // Legacy support if needed, but better to remove
      } as any);

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

    // If we already have a user and a valid token, don't refetch
    const currentToken = getAccessToken();
    if (currentState.user && currentToken && !isTokenExpired(currentToken)) {
      // User is already set and token is valid, just ensure status is authenticated
      if (currentState.status !== "authenticated") {
        set({ status: "authenticated" });
      }
      return;
    }

    set({ status: "checking" });

    // If we have a valid token that's not expired, try to get user info
    if (currentToken && !isTokenExpired(currentToken)) {
      try {
        // Decode token to get userId
        const payload = decodeToken(currentToken);
        if (payload?.userId) {
          // Only fetch user if we don't already have it or if userId doesn't match
          if (!currentState.user || currentState.user.id !== payload.userId) {
            // Fetch user info
            const { user } = await userService.getUserById(payload.userId);

            set({
              user,
              status: "authenticated",
            });
            return;
          } else {
            // User already matches, just set status
            set({ status: "authenticated" });
            return;
          }
        }
      } catch (error) {
        // If fetching user fails, token might be invalid, try refresh
        console.error("Failed to fetch user:", error);
        // Fall through to refresh logic
      }
    }

    // Only refresh if token is missing or expired
    // Don't refresh if we just logged in (token is fresh)
    if (!currentToken || isTokenExpired(currentToken)) {
      try {
        // Use raw axios to avoid interceptor loop
        const { data } = await axios.post<RefreshTokenResponse>(
          `${API_BASE_URL}${AUTH_REFRESH_ENDPOINT}`,
          {},
          { withCredentials: true },
        );

        const newToken = data.accessToken;
        setAccessToken(newToken);

        // Decode token to get userId
        const payload = decodeToken(newToken);
        if (payload?.userId) {
          // Fetch user info using the new token
          // Fetch user info using the new token
          const { user } = await userService.getUserById(payload.userId);
          set({
            user: user,
            status: "authenticated",
          });
        } else {
          // If we can't decode, still mark as authenticated (token is valid)
          set({ status: "authenticated" });
        }
      } catch (error) {
        // Refresh failed (no cookie or expired) - user needs to login
        set({ status: "guest", user: null });
        removeAccessToken();
        // Force redirect to login to ensure clean state
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login")
        ) {
          window.location.href = "/login";
        }
      }
    } else {
      // Token exists and is valid, but we couldn't fetch user - mark as guest
      set({ status: "guest", user: null });
      removeAccessToken();
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
