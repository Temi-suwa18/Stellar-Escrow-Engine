import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes a password to something other than the plaintext', async () => {
    const hash = await service.hash('correct horse battery staple 1');
    expect(hash).not.toBe('correct horse battery staple 1');
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
  });

  it('verifies a correct password against its own hash', async () => {
    const hash = await service.hash('correct horse battery staple 1');
    await expect(service.verify('correct horse battery staple 1', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password against a hash', async () => {
    const hash = await service.hash('correct horse battery staple 1');
    await expect(service.verify('wrong password', hash)).resolves.toBe(false);
  });

  it('produces a different hash each time (random salt), even for the same input', async () => {
    const a = await service.hash('same password 1');
    const b = await service.hash('same password 1');
    expect(a).not.toBe(b);
    // Both must still verify correctly despite differing.
    await expect(service.verify('same password 1', a)).resolves.toBe(true);
    await expect(service.verify('same password 1', b)).resolves.toBe(true);
  });
});
