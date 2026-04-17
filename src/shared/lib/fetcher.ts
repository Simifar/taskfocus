import type { ApiResponse } from "@/shared/types";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(path: string, query?: FetchOptions["query"]): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, query, headers, ...rest } = options;
  const url = buildUrl(path, query);

  const init: RequestInit = {
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...rest,
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  const response = await fetch(url, init);

  if (response.status === 204) return undefined as T;

  const envelope = (await response.json()) as ApiResponse<T>;
  if (!envelope.success) {
    throw new ApiError(envelope.error.code, envelope.error.message, response.status);
  }
  return envelope.data;
}
