import { useAuthStore } from '@/store/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Attach the stored access token as a Bearer header. Defaults to true. */
  auth?: boolean;
}

/**
 * Thin fetch wrapper for the Backend API. Prefixes every call with
 * `NEXT_PUBLIC_API_URL` + `/v1`, attaches the stored access token unless
 * opted out, and normalizes the Stripe-style `{ error: {...} }` envelope
 * the API returns on failure into a typed ApiError.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = useAuthStore.getState().accessToken;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const message =
      (data as { error?: { message?: string } } | undefined)?.error?.message ??
      `Request failed with status ${response.status}`;
    const code = (data as { error?: { code?: string } } | undefined)?.error?.code;
    throw new ApiError(message, response.status, code);
  }

  return data as T;
}
