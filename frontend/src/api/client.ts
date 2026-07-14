const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

type ApiEnvelope<T> = {
  data: T;
};

type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
};

export class ApiError extends Error {
  code: string;
  details: Record<string, unknown>;
  status: number;

  constructor(status: number, code: string, message: string, details: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    let body: ApiErrorEnvelope | null = null;
    try {
      body = (await response.json()) as ApiErrorEnvelope;
    } catch {
      body = null;
    }
    throw new ApiError(
      response.status,
      body?.error.code ?? "REQUEST_FAILED",
      body?.error.message ?? "Request failed",
      body?.error.details ?? {}
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as ApiEnvelope<T>;
  return body.data;
}

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

