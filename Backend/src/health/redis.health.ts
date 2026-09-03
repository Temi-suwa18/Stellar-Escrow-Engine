import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicatorResult, HealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { EnvConfig } from '../config/env.validation';

/**
 * Pings Redis with a short-lived connection per check rather than reusing a
 * shared client, so a stuck/leaked connection elsewhere in the app can never
 * make health checks report a false "up".
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const client = new Redis(this.config.get('REDIS_URL', { infer: true }), {
      lazyConnect: true,
      connectTimeout: 2_000,
      maxRetriesPerRequest: 1,
    });

    try {
      await client.connect();
      const pong = await client.ping();
      const isHealthy = pong === 'PONG';
      const result = this.getStatus(key, isHealthy);
      if (!isHealthy) {
        throw new HealthCheckError('Redis health check failed', result);
      }
      return result;
    } catch (error) {
      const result = this.getStatus(key, false, {
        message: error instanceof Error ? error.message : 'Unknown Redis error',
      });
      throw new HealthCheckError('Redis health check failed', result);
    } finally {
      client.disconnect();
    }
  }
}
