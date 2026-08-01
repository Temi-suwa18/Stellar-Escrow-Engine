import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Session {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

interface AuthState {
  session: Session | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (session: Session) => void;
  clearSession: () => void;
}

/**
 * Persisted to localStorage so a page refresh doesn't drop the session.
 * The Backend issues both tokens in the response body rather than an
 * httpOnly cookie, so this is the pragmatic client-side equivalent —
 * acceptable for the current API-key-first product, revisit if the
 * dashboard grows into something handling more sensitive session data.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      accessToken: null,
      isAuthenticated: false,
      setSession: (session) =>
        set({ session, accessToken: session.accessToken, isAuthenticated: true }),
      clearSession: () => set({ session: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: 'escra-auth' },
  ),
);
