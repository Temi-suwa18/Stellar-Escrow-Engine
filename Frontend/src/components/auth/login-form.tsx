'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useAuthStore, type Session } from '@/store/auth-store';
import { OAuthButtons } from './oauth-buttons';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
  twoFactorToken: z.string().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginResponse {
  requiresTwoFactor: boolean;
  session?: Session;
}

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [requires2fa, setRequires2fa] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const result = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        auth: false,
        body: {
          email: values.email,
          password: values.password,
          twoFactorToken: values.twoFactorToken || undefined,
        },
      });

      if (result.requiresTwoFactor) {
        setRequires2fa(true);
        return;
      }
      if (result.session) {
        setSession(result.session);
        router.push('/dashboard');
      }
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'Something went wrong. Try again.');
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <OAuthButtons />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs">OR</span>
        <Separator className="flex-1" />
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Couldn&apos;t sign you in</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="ada@company.com"
          disabled={requires2fa}
          {...register('email')}
        />
        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          disabled={requires2fa}
          {...register('password')}
        />
        {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
      </div>

      {requires2fa && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="twoFactorToken" className="flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" /> Authenticator code
          </Label>
          <Input
            id="twoFactorToken"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456 or a recovery code"
            autoFocus
            {...register('twoFactorToken')}
          />
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="mt-1">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {requires2fa ? 'Verify & sign in' : 'Sign in'}
      </Button>
    </form>
  );
}
