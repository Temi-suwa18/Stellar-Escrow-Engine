import { EscrowApiError, type EscrowErrorType } from './errors';
import type {
  CreateEscrowInput,
  Escrow,
  FundEscrowInput,
  ListEscrowsQuery,
  ListEscrowsResult,
  RefundEscrowInput,
  ReleaseEscrowInput,
} from './types';

const DEFAULT_BASE_URL = 'https://api.escra.dev';

export interface StellarEscrowOptions {
  /** Defaults to the production API — override for local dev or self-hosted instances. */
  baseUrl?: string;
  /** Override fetch, e.g. to inject retries/telemetry. Defaults to the global fetch. */
  fetch?: typeof fetch;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

interface ErrorEnvelope {
  error?: {
    type?: EscrowErrorType;
    code?: string;
    message?: string;
    requestId?: string;
  };
}

/**
 * Client for the ESCRA API. `create`/`list`/`get` here; lifecycle methods
 * (fund, release, refund, dispute, resolve) are added lower in this class.
 */
export class StellarEscrow {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(apiKey: string, options: StellarEscrowOptions = {}) {
    if (!apiKey) {
      throw new Error('StellarEscrow requires an API key — pass it as the first constructor argument.');
    }
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.fetchImpl = options.fetch ?? globalThis.fetch;

    if (!this.fetchImpl) {
      throw new Error(
        'No global fetch available — pass { fetch } explicitly on a runtime without one (Node < 18).',
      );
    }
  }

  /** @internal exposed for resource method modules; not part of the public API surface. */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query } = options;

    const url = new URL(`${this.baseUrl}/v1${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    const response = await this.fetchImpl(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
    const payload: unknown = isJson ? await response.json() : undefined;

    if (!response.ok) {
      const envelope = (payload ?? {}) as ErrorEnvelope;
      throw new EscrowApiError(
        envelope.error?.message ?? `Request failed with status ${response.status}`,
        response.status,
        {
          type: envelope.error?.type,
          code: envelope.error?.code,
          requestId: envelope.error?.requestId,
        },
      );
    }

    return payload as T;
  }

  /**
   * Registers a new escrow deal. If it's chain-eligible (has an
   * `arbitratorWallet` and a resolvable asset), the response includes
   * `unsignedCreateTransactionXdr` for the depositor's wallet to sign.
   */
  create(input: CreateEscrowInput): Promise<Escrow> {
    return this.request<Escrow>('/escrows', { method: 'POST', body: input });
  }

  list(query: ListEscrowsQuery = {}): Promise<ListEscrowsResult> {
    return this.request<ListEscrowsResult>('/escrows', {
      query: query as Record<string, string | number | undefined>,
    });
  }

  get(escrowId: string): Promise<Escrow> {
    return this.request<Escrow>(`/escrows/${encodeURIComponent(escrowId)}`);
  }

  /** Marks an escrow funded. If it's chain-eligible, `stellarTxHash` is verified against the real transaction before this succeeds. */
  fund(escrowId: string, input: FundEscrowInput): Promise<Escrow> {
    return this.request<Escrow>(`/escrows/${encodeURIComponent(escrowId)}/fund`, {
      method: 'POST',
      body: input,
    });
  }

  /** Full release — only valid when there are no milestones, or every milestone is already released. */
  release(escrowId: string, input: ReleaseEscrowInput = {}): Promise<Escrow> {
    return this.request<Escrow>(`/escrows/${encodeURIComponent(escrowId)}/release`, {
      method: 'POST',
      body: input,
    });
  }

  /** Releases a single milestone; the escrow auto-completes once every milestone has been released. */
  releaseMilestone(escrowId: string, milestoneId: string): Promise<Escrow> {
    return this.request<Escrow>(
      `/escrows/${encodeURIComponent(escrowId)}/milestones/${encodeURIComponent(milestoneId)}/release`,
      { method: 'POST' },
    );
  }

  refund(escrowId: string, input: RefundEscrowInput = {}): Promise<Escrow> {
    return this.request<Escrow>(`/escrows/${encodeURIComponent(escrowId)}/refund`, {
      method: 'POST',
      body: input,
    });
  }
}
