import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SignupForm } from './signup-form';
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

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Ada Lovelace' } });
  fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'ada@example.com' } });
  fireEvent.change(screen.getByLabelText('Organization'), { target: { value: 'Acme Store' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correcthorse1' } });
}

describe('SignupForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    mockedApiFetch.mockReset();
    useAuthStore.getState().clearSession();
  });

  it('rejects a password with no number', async () => {
    render(<SignupForm />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'nonumbershere' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Include at least one number')).toBeInTheDocument();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('rejects a too-short organization name', async () => {
    render(<SignupForm />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText('Organization'), { target: { value: 'A' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Enter your organization name')).toBeInTheDocument();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('registers and redirects to the dashboard on success', async () => {
    const session = {
      accessToken: 'at_1',
      refreshToken: 'rt_1',
      refreshTokenExpiresAt: '2030-01-01T00:00:00.000Z',
    };
    mockedApiFetch.mockResolvedValue(session);

    render(<SignupForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/dashboard'));
    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({
        method: 'POST',
        auth: false,
        body: expect.objectContaining({
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          organizationName: 'Acme Store',
        }),
      }),
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('shows the server error message (e.g. duplicate email) without redirecting', async () => {
    const { ApiError } = await import('@/lib/api-client');
    mockedApiFetch.mockRejectedValue(new ApiError('An account with this email already exists', 409));

    render(<SignupForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('An account with this email already exists')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
