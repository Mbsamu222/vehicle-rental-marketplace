import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import type { AuthTokens, PaginationMeta } from "./types";

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiListResult<T> {
  data: T[];
  meta: PaginationMeta & Record<string, unknown>;
}

const ACCESS_TOKEN_KEY = "vrm.accessToken";
const REFRESH_TOKEN_KEY = "vrm.refreshToken";

export const tokenStorage = {
  get accessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  get refreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(tokens: AuthTokens) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

let unauthorizedHandler: (() => void) | null = null;
export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(http: AxiosInstance): Promise<string | null> {
  const refreshToken = tokenStorage.refreshToken;
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = http
      .post<ApiSuccessEnvelope<AuthTokens>>("/auth/refresh", { refreshToken })
      .then((res) => {
        tokenStorage.set(res.data.data);
        return res.data.data.accessToken;
      })
      .catch(() => {
        tokenStorage.clear();
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export function createApiClient(baseURL: string) {
  const http = axios.create({ baseURL, timeout: 20000 });

  http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.accessToken;
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  http.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<{ message?: string }>) => {
      const originalRequest = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
      const isAuthRoute = originalRequest?.url?.includes("/auth/");

      if (error.response?.status === 401 && originalRequest && !originalRequest._retried && !isAuthRoute) {
        originalRequest._retried = true;
        const newToken = await refreshAccessToken(http);
        if (newToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return http(originalRequest);
        }
        unauthorizedHandler?.();
      }

      const message = error.response?.data?.message ?? error.message ?? "Something went wrong";
      return Promise.reject(new Error(message));
    },
  );

  return http;
}

export async function unwrap<T>(promise: Promise<{ data: ApiSuccessEnvelope<T> }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}

export async function unwrapList<T>(
  promise: Promise<{ data: ApiSuccessEnvelope<T[]> }>,
): Promise<ApiListResult<T>> {
  const res = await promise;
  return { data: res.data.data, meta: (res.data.meta ?? {}) as PaginationMeta & Record<string, unknown> };
}
