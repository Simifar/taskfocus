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

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

type FetchOptions = Omit<RequestInit, "body" | "signal"> & {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  timeout?: number;
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
  const {
    body,
    query,
    headers,
    signal: externalSignal,
    timeout = DEFAULT_REQUEST_TIMEOUT_MS,
    ...rest
  } = options;

  const url = buildUrl(path, query);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  if (externalSignal) {
    externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const init: RequestInit = {
    credentials: "include",
    signal: controller.signal,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...rest,
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  try {
    const response = await fetch(url, init);

    if (response.status === 204) return null as T;

    const envelope = (await response.json()) as ApiResponse<T>;
    if (!envelope.success) {
      throw new ApiError(envelope.error.code, envelope.error.message, response.status);
    }
    return envelope.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("TIMEOUT", "Превышено время ожидания запроса", 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
