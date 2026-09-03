import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './auth-store';

const SESSION = {
  accessToken: 'at_123',
  refreshToken: 'rt_456',
  refreshTokenExpiresAt: '2030-01-01T00:00:00.000Z',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    localStorage.clear();
  });

  it('starts unauthenticated with no session', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.session).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('setSession stores the session and flips isAuthenticated', () => {
    useAuthStore.getState().setSession(SESSION);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.session).toEqual(SESSION);
    expect(state.accessToken).toBe('at_123');
  });

  it('clearSession resets everything back to signed-out', () => {
    useAuthStore.getState().setSession(SESSION);
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.session).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('persists the session to localStorage under the escra-auth key', () => {
    useAuthStore.getState().setSession(SESSION);

    const raw = localStorage.getItem('escra-auth');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { state: { session: typeof SESSION } };
    expect(parsed.state.session).toEqual(SESSION);
  });

  it('overwriting with a new session replaces the old one entirely', () => {
    useAuthStore.getState().setSession(SESSION);
    const secondSession = { ...SESSION, accessToken: 'at_new' };
    useAuthStore.getState().setSession(secondSession);

    expect(useAuthStore.getState().accessToken).toBe('at_new');
  });
});
