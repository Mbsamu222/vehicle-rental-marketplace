import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { PaginationMeta } from "./types";
import { auth } from "./firebase";

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiListResult<T> {
  data: T[];
  meta: PaginationMeta & Record<string, unknown>;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

let unauthorizedHandler: (() => void) | null = null;
export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

export function createApiClient(baseURL: string) {
  const http = axios.create({ baseURL, timeout: 20000 });

  http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  http.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<{ message?: string }>) => {
      if (error.response?.status === 401) {
        unauthorizedHandler?.();
      }
      const message = error.response?.data?.message ?? error.message ?? "Something went wrong";
      return Promise.reject(new ApiClientError(message, error.response?.status));
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
