import type { ApiErrorBody } from "../api-types";
import { getAccessToken } from "../auth/token-storage";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiInit = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = init;
  const token = auth ? getAccessToken() : null;

  const response = await fetch(path.startsWith("/api") ? path : `/api${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorBody = (await response.json()) as ApiErrorBody;
      if (errorBody.error) message = errorBody.error;
    } catch {
      // Response body was not JSON.
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export async function apiForm<T>(
  path: string,
  formData: FormData,
  init: Omit<RequestInit, "body"> = {},
): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(path.startsWith("/api") ? path : `/api${path}`, {
    method: "POST",
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    body: formData,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorBody = (await response.json()) as ApiErrorBody;
      if (errorBody.error) message = errorBody.error;
    } catch {
      // Response body was not JSON.
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}
