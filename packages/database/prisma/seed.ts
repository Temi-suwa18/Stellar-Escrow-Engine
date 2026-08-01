import { createHash, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Local-dev seed data. Exercises every top-level relation added in Module 2
 * so `pnpm db:migrate` + `pnpm db:seed` gives a non-empty database to build
 * the rest of the platform against. Password auth isn't wired up yet
 * (Module 3), so the seed user has no password hash — sign-in will be added
 * once authentication lands.
 */
async function main(): Promise<void> {
  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      name: 'Ada Lovelace',
      emailVerifiedAt: new Date(),
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Store',
      slug: 'acme',
      defaultCurrency: 'USD',
      settings: {
        create: {
          checkoutBranding: { primaryColor: '#4f46e5' },
        },
      },
      members: {
        create: {
          userId: owner.id,
          role: 'OWNER',
        },
      },
    },
  });

  const wallet = await prisma.wallet.upsert({
    where: {
      organizationId_stellarPublicKey: {
        organizationId: organization.id,
        stellarPublicKey: 'GDEMOOPERATINGWALLET0000000000000000000000000000000000000',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      label: 'Operating wallet',
      stellarPublicKey: 'GDEMOOPERATINGWALLET0000000000000000000000000000000000000',
      network: 'TESTNET',
      purpose: 'OPERATING',
      isDefault: true,
    },
  });

  const customer = await prisma.customer.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: 'customer@example.com',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      email: 'customer@example.com',
      name: 'Grace Hopper',
    },
  });

  const product = await prisma.product.create({
    data: {
      organizationId: organization.id,
      name: 'Pro plan',
      description: 'Monthly subscription to the Pro tier',
      type: 'RECURRING',
      prices: {
        create: {
          organizationId: organization.id,
          unitAmount: '29.0000000',
          asset: 'USDC:GDEMOISSUERUSDC000000000000000000000000000000000000000',
          recurringInterval: 'MONTH',
          recurringIntervalCount: 1,
          usageType: 'LICENSED',
        },
      },
    },
    include: { prices: true },
  });

  const rawTestKey = `sk_test_${randomBytes(24).toString('hex')}`;
  await prisma.apiKey.create({
    data: {
      organizationId: organization.id,
      name: 'Default test key',
      keyPrefix: rawTestKey.slice(0, 12),
      hashedKey: createHash('sha256').update(rawTestKey).digest('hex'),
      mode: 'TEST',
      scopes: ['*'],
      createdByUserId: owner.id,
    },
  });

  console.log('Seed complete:');
  console.log(`  Organization: ${organization.name} (${organization.slug})`);
  console.log(`  Owner:        ${owner.email}`);
  console.log(`  Wallet:       ${wallet.stellarPublicKey}`);
  console.log(`  Customer:     ${customer.email}`);
  console.log(`  Product:      ${product.name} (${product.prices.length} price)`);
  console.log(`  Test API key: ${rawTestKey} (shown once — this is a seed key, not a secret)`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
