import { createApiClient } from "./client";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export const http = createApiClient(baseURL);
