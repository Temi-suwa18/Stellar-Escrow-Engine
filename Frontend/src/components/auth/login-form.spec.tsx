import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LoginForm } from './login-form';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/lib/api-client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api-client')>('@/lib/api-client');
  return { ...actual, apiFetch: vi.fn() };
});

const mockedApiFetch = vi.mocked(apiFetch);

describe('LoginForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    mockedApiFetch.mockReset();
    useAuthStore.getState().clearSession();
  });

  it('shows validation errors instead of submitting for an invalid email', async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('logs in and redirects to the dashboard on a successful, non-2FA response', async () => {
    const session = {
      accessToken: 'at_1',
      refreshToken: 'rt_1',
      refreshTokenExpiresAt: '2030-01-01T00:00:00.000Z',
    };
    mockedApiFetch.mockResolvedValue({ requiresTwoFactor: false, session });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/dashboard'));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe('at_1');
  });

  it('reveals the 2FA field instead of redirecting when the server asks for one', async () => {
    mockedApiFetch.mockResolvedValue({ requiresTwoFactor: true });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByLabelText(/authenticator code/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('shows the server error message on a failed login without redirecting', async () => {
    const { ApiError } = await import('@/lib/api-client');
    mockedApiFetch.mockRejectedValue(new ApiError('Invalid email or password', 401));

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
