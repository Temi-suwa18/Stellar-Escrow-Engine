import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { prisma, type PrismaClient } from '@stellar-commerce/database';

/**
 * Thin NestJS lifecycle wrapper around the shared Prisma singleton from
 * `@stellar-commerce/database`. The singleton itself is process-wide (so hot
 * reload in dev doesn't open a new connection pool per reload); this service
 * just hooks it into Nest's module lifecycle so the pool drains cleanly on
 * shutdown.
 *
 * Deliberately does NOT eagerly `$connect()` in `onModuleInit`: Prisma
 * connects lazily on first query, and forcing a connection at boot would
 * make the whole process fail to start whenever the database is briefly
 * unreachable. `/health/ready` (DatabaseHealthIndicator) is the intended
 * place to verify DB connectivity — that's what orchestrators should gate
 * traffic routing on, not process startup.
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client: PrismaClient = prisma;

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
