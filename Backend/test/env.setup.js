// Minimal valid env so envSchema.parse() succeeds in e2e tests without a real .env file.
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
process.env.API_URL = process.env.API_URL ?? 'http://localhost:4000';
process.env.API_PORT = process.env.API_PORT ?? '4000';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://stellar:stellar@localhost:5432/stellar_commerce_test';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379/1';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-at-least-32-chars-long';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-at-least-32-chars-long';
process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'test-session-secret-at-least-32-chars-long';
process.env.STELLAR_HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
process.env.SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
process.env.STELLAR_NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2022';
process.env.WEBHOOK_SIGNING_SECRET =
  process.env.WEBHOOK_SIGNING_SECRET ?? 'test-webhook-secret-at-least-32-chars-long';
