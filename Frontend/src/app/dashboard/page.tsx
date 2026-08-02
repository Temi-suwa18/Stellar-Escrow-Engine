'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/marketing/logo';
import { ApiKeysCard } from '@/components/dashboard/api-keys-card';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface Me {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
  organizations: Organization[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, session, clearSession } = useAuthStore();

  useEffect(() => {
    if (!accessToken) router.replace('/login');
  }, [accessToken, router]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiFetch<Me>('/auth/me'),
    enabled: Boolean(accessToken),
    retry: false,
  });

  async function handleSignOut() {
    try {
      if (session?.refreshToken) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          auth: false,
          body: { refreshToken: session.refreshToken },
        });
      }
    } finally {
      clearSession();
      router.push('/login');
    }
  }

  if (!accessToken) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Button
            variant="ghost"
            size="sm"
            className="text-xs uppercase tracking-widest"
            onClick={handleSignOut}
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </header>

      <main className="container flex flex-1 flex-col gap-8 py-12">
        {isLoading && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your account…
          </div>
        )}

        {isError && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6 text-sm text-destructive">
              {error instanceof ApiError ? error.message : 'Failed to load your account.'}
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-primary flex items-center gap-1.5 text-xs uppercase tracking-widest">
                <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                Dashboard
              </span>
              <h1 className="text-2xl font-bold tracking-tight">
                Welcome back{data.name ? `, ${data.name}` : ''}
              </h1>
              <p className="text-muted-foreground text-sm">{data.email}</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide">Organizations</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {data.organizations.length === 0 && (
                  <p className="text-muted-foreground text-sm">No organizations yet.</p>
                )}
                {data.organizations.map((org) => (
                  <div
                    key={org.id}
                    className="border-border flex items-center justify-between rounded-md border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{org.name}</p>
                      <p className="text-muted-foreground text-xs">{org.slug}</p>
                    </div>
                    <Badge variant="secondary" className="uppercase tracking-widest">
                      {org.role}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {data.organizations[0] && <ApiKeysCard organizationId={data.organizations[0].id} />}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide">Security</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-border flex items-center justify-between rounded-md border px-4 py-3">
                  <p className="text-sm">Two-factor authentication</p>
                  <Badge variant={data.twoFactorEnabled ? 'success' : 'outline'}>
                    {data.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
