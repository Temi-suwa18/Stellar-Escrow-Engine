import { Test } from '@nestjs/testing';
import { DiskHealthIndicator, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';

describe('HealthController', () => {
  let controller: HealthController;
  const check = jest.fn(async (indicators: Array<() => Promise<Record<string, unknown>>>) => {
    const results = await Promise.all(indicators.map((indicator) => indicator()));
    return { status: 'ok', details: Object.assign({}, ...results) as Record<string, unknown> };
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: { check } },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: jest.fn().mockResolvedValue({ memory_heap: { status: 'up' } }),
            checkRSS: jest.fn().mockResolvedValue({ memory_rss: { status: 'up' } }),
          },
        },
        {
          provide: DiskHealthIndicator,
          useValue: {
            checkStorage: jest.fn().mockResolvedValue({ disk: { status: 'up' } }),
          },
        },
        {
          provide: RedisHealthIndicator,
          useValue: { isHealthy: jest.fn().mockResolvedValue({ redis: { status: 'up' } }) },
        },
      ],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  afterEach(() => jest.clearAllMocks());

  it('reports liveness using only in-process memory checks', async () => {
    const result = await controller.live();
    expect(result).toEqual({
      status: 'ok',
      details: { memory_heap: { status: 'up' }, memory_rss: { status: 'up' } },
    });
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('reports readiness using redis and disk checks', async () => {
    const result = await controller.ready();
    expect(result.status).toBe('ok');
    expect(check).toHaveBeenCalledTimes(1);
  });
});
