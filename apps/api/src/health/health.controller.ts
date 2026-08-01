import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  /**
   * Liveness: is the process itself running and not wedged? Cheap, no
   * external dependencies — used by orchestrators to decide whether to
   * restart the container.
   */
  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
    ]);
  }

  /**
   * Readiness: can this instance actually serve traffic right now? Checks
   * every dependency the API needs — used by load balancers/orchestrators
   * to decide whether to route requests here.
   */
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.redis.isHealthy('redis'),
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }
}
