'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Copy, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiFetch, ApiError } from '@/lib/api-client';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  mode: 'TEST' | 'LIVE';
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

const createKeySchema = z.object({
  name: z.string().min(2, 'Give this key a name').max(120),
  mode: z.enum(['TEST', 'LIVE']),
});
type CreateKeyValues = z.infer<typeof createKeySchema>;

/**
 * The Escrows API is authenticated with an org-level API key (X-Api-Key),
 * not the dashboard session — this card is where those keys are managed,
 * matching Backend/src/api-keys/api-keys.controller.ts (JWT + role guarded,
 * scoped to :organizationId).
 */
export function ApiKeysCard({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys', organizationId],
    queryFn: () => apiFetch<ApiKey[]>(`/organizations/${organizationId}/api-keys`),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateKeyValues>({
    resolver: zodResolver(createKeySchema),
    defaultValues: { name: '', mode: 'TEST' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setCopied(false);
    try {
      const created = await apiFetch<ApiKey & { rawKey: string }>(
        `/organizations/${organizationId}/api-keys`,
        { method: 'POST', body: values },
      );
      setRevealedKey(created.rawKey);
      reset({ name: '', mode: values.mode });
      await queryClient.invalidateQueries({ queryKey: ['api-keys', organizationId] });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Failed to create key.');
    }
  });

  const revokeMutation = useMutation({
    mutationFn: (apiKeyId: string) =>
      apiFetch(`/organizations/${organizationId}/api-keys/${apiKeyId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys', organizationId] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wide">API keys</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {revealedKey && (
          <Alert>
            <AlertTitle>Copy this key now</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>You won&apos;t be able to see it again.</span>
              <div className="flex items-center gap-2">
                <code className="bg-muted min-w-0 flex-1 truncate rounded px-2 py-1.5 font-mono text-xs">
                  {revealedKey}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    void navigator.clipboard.writeText(revealedKey);
                    setCopied(true);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              {copied && <span className="text-xs text-emerald-600 dark:text-emerald-400">Copied.</span>}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label htmlFor="keyName">Name</Label>
            <Input id="keyName" placeholder="Backend server key" {...register('name')} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="keyMode">Mode</Label>
            <select
              id="keyMode"
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
              {...register('mode')}
            >
              <option value="TEST">Test</option>
              <option value="LIVE">Live</option>
            </select>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Create key
          </Button>
        </form>
        {formError && <p className="text-destructive text-xs">{formError}</p>}

        <div className="flex flex-col gap-2">
          {isLoading && <p className="text-muted-foreground text-sm">Loading keys…</p>}
          {keys?.length === 0 && (
            <p className="text-muted-foreground text-sm">No API keys yet — create one above.</p>
          )}
          {keys?.map((key) => (
            <div
              key={key.id}
              className="border-border flex items-center justify-between gap-3 rounded-md border px-4 py-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{key.name}</p>
                  <Badge
                    variant={key.mode === 'LIVE' ? 'default' : 'secondary'}
                    className="text-[10px] uppercase"
                  >
                    {key.mode}
                  </Badge>
                  {key.revokedAt && (
                    <Badge variant="outline" className="text-destructive text-[10px] uppercase">
                      Revoked
                    </Badge>
                  )}
                </div>
                <code className="text-muted-foreground font-mono text-xs">{key.keyPrefix}…</code>
              </div>
              {!key.revokedAt && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => revokeMutation.mutate(key.id)}
                  disabled={revokeMutation.isPending}
                  aria-label={`Revoke ${key.name}`}
                >
                  <Trash2 className="text-destructive h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
