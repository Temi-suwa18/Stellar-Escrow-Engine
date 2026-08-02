import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, ApiError } from './api-client';
import { useAuthStore } from '@/store/auth-store';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('apiFetch', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefixes every request with /v1', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/escrows');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/v1/escrows');
  });

  it('attaches the stored access token as a Bearer header when auth is not opted out', async () => {
    useAuthStore.getState().setSession({
      accessToken: 'at_123',
      refreshToken: 'rt',
      refreshTokenExpiresAt: '2030-01-01T00:00:00.000Z',
    });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/auth/me');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer at_123');
  });

  it('omits the Authorization header when auth: false is passed', async () => {
    useAuthStore.getState().setSession({
      accessToken: 'at_123',
      refreshToken: 'rt',
      refreshTokenExpiresAt: '2030-01-01T00:00:00.000Z',
    });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/auth/login', { auth: false, method: 'POST', body: { email: 'a@b.com' } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('serializes the request body as JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/escrows', { method: 'POST', body: { amount: 500 } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(JSON.stringify({ amount: 500 }));
  });

  it('resolves with the parsed JSON body on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'esc_1' }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiFetch<{ id: string }>('/escrows/esc_1');

    expect(result).toEqual({ id: 'esc_1' });
  });

  it('throws a typed ApiError decoded from the Stripe-style error envelope', async () => {
    // A fresh Response per call — Response bodies can only be read once.
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          { error: { message: 'Cannot fund an escrow in FUNDED status', code: 'conflict' } },
          409,
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/escrows/esc_1/fund', { method: 'POST' })).rejects.toMatchObject({
      message: 'Cannot fund an escrow in FUNDED status',
      status: 409,
      code: 'conflict',
    });
    await expect(apiFetch('/escrows/esc_1/fund', { method: 'POST' })).rejects.toBeInstanceOf(ApiError);
  });

  it('falls back to a generic message when the error response is not JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('Internal Server Error', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/escrows')).rejects.toMatchObject({
      message: 'Request failed with status 500',
      status: 500,
    });
  });
});
