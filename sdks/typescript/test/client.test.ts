import { describe, expect, it, vi } from 'vitest';
import { StellarEscrow } from '../src/client';
import { EscrowApiError } from '../src/errors';

function fakeFetch(responses: Array<{ status: number; body: unknown }>): typeof fetch {
  let call = 0;
  return vi.fn((): Promise<Response> => {
    const res = responses[Math.min(call, responses.length - 1)] ?? responses[0];
    call++;
    if (!res) throw new Error('fakeFetch: no responses configured');
    return Promise.resolve(
      new Response(JSON.stringify(res.body), {
        status: res.status,
        headers: { 'content-type': 'application/json' },
      }),
    );
  });
}

describe('StellarEscrow', () => {
  it('throws without an API key', () => {
    expect(() => new StellarEscrow('')).toThrow(/requires an API key/);
  });

  it('sends the API key header and hits the /v1-prefixed path', async () => {
    const fetchImpl = fakeFetch([{ status: 200, body: { id: 'esc_1', status: 'PENDING' } }]);
    const client = new StellarEscrow('sk_test_123', {
      baseUrl: 'https://api.example.com',
      fetch: fetchImpl,
    });

    await client.get('esc_1');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe('https://api.example.com/v1/escrows/esc_1');
    expect((init.headers as Record<string, string>)['X-Api-Key']).toBe('sk_test_123');
  });

  it('serializes list() query params', async () => {
    const fetchImpl = fakeFetch([{ status: 200, body: { items: [], pagination: {} } }]);
    const client = new StellarEscrow('sk_test_123', { fetch: fetchImpl });

    await client.list({ status: 'FUNDED', page: 2, limit: 10 });

    const [url] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.searchParams.get('status')).toBe('FUNDED');
    expect(parsed.searchParams.get('page')).toBe('2');
    expect(parsed.searchParams.get('limit')).toBe('10');
  });

  it('POSTs create() with a JSON body', async () => {
    const fetchImpl = fakeFetch([{ status: 200, body: { id: 'esc_2' } }]);
    const client = new StellarEscrow('sk_test_123', { fetch: fetchImpl });

    await client.create({
      category: 'FREELANCE',
      amount: 500,
      asset: 'USDC',
      depositorWallet: 'GABC',
      beneficiaryWallet: 'GXYZ',
    });

    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toMatchObject({ category: 'FREELANCE', amount: 500 });
  });

  it('throws a typed EscrowApiError on a non-2xx response, using the Stripe-style envelope', async () => {
    const fetchImpl = fakeFetch([
      {
        status: 409,
        body: {
          error: {
            type: 'invalid_request_error',
            code: 'conflict',
            message: 'Cannot fund an escrow in FUNDED status',
            requestId: 'req_123',
          },
        },
      },
    ]);
    const client = new StellarEscrow('sk_test_123', { fetch: fetchImpl });

    await expect(client.fund('esc_1', { stellarTxHash: 'tx' })).rejects.toMatchObject({
      message: 'Cannot fund an escrow in FUNDED status',
      status: 409,
      code: 'conflict',
      requestId: 'req_123',
    });
    await expect(client.fund('esc_1', { stellarTxHash: 'tx' })).rejects.toBeInstanceOf(EscrowApiError);
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response('Internal Server Error', { status: 500 })),
    ) as unknown as typeof fetch;
    const client = new StellarEscrow('sk_test_123', { fetch: fetchImpl });

    await expect(client.get('esc_1')).rejects.toMatchObject({
      message: 'Request failed with status 500',
      status: 500,
    });
  });

  it('hits the correct paths for every lifecycle method', async () => {
    const fetchImpl = fakeFetch([{ status: 200, body: {} }]);
    const client = new StellarEscrow('sk_test_123', {
      baseUrl: 'https://api.example.com',
      fetch: fetchImpl,
    });

    const calls: Array<[string, string]> = [];
    const record = async (fn: () => Promise<unknown>) => {
      await fn();
      const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1) as [
        string,
        RequestInit,
      ];
      calls.push([init.method ?? 'GET', new URL(url).pathname]);
    };

    await record(() => client.release('esc_1', {}));
    await record(() => client.releaseMilestone('esc_1', 'm_1'));
    await record(() => client.refund('esc_1', {}));
    await record(() => client.dispute('esc_1', { reason: 'bad delivery' }));
    await record(() => client.resolve('esc_1', { outcome: 'RELEASE' }));
    await record(() => client.getOnChain('esc_1'));

    expect(calls).toEqual([
      ['POST', '/v1/escrows/esc_1/release'],
      ['POST', '/v1/escrows/esc_1/milestones/m_1/release'],
      ['POST', '/v1/escrows/esc_1/refund'],
      ['POST', '/v1/escrows/esc_1/dispute'],
      ['POST', '/v1/escrows/esc_1/resolve'],
      ['GET', '/v1/escrows/esc_1/on-chain'],
    ]);
  });
});
