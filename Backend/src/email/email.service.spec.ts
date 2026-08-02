/* eslint-disable @typescript-eslint/no-unsafe-assignment --
   same rationale as escrows.service.spec.ts: jest's loosely-typed mock/matcher APIs
   (expect.stringContaining, .mock.calls[n][0]) trip this heuristic even though the
   values are used safely here. */
import { EmailService } from './email.service';
import type { ConfigService } from '@nestjs/config';

function createConfigMock() {
  const values: Record<string, unknown> = {
    EMAIL_FROM: 'ESCRA <noreply@stellarescrow.dev>',
    SMTP_HOST: undefined, // dev mode: no real transporter, logs instead of sending
  };
  return { get: jest.fn((key: string) => values[key]) } as unknown as ConfigService & {
    get: jest.Mock;
  };
}

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    service = new EmailService(createConfigMock());
    service.onModuleInit(); // no SMTP_HOST -> stays in dev/log mode, no real network I/O
  });

  describe('sendMagicLink', () => {
    it('sends a text and HTML body containing the sign-in URL', async () => {
      const sendSpy = jest.spyOn(service, 'send').mockResolvedValue(undefined);

      await service.sendMagicLink('ada@example.com', 'https://app.escra.dev/login/magic?token=abc');

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'ada@example.com',
          text: expect.stringContaining('https://app.escra.dev/login/magic?token=abc'),
          html: expect.stringContaining('https://app.escra.dev/login/magic?token=abc'),
        }),
      );
    });
  });

  describe('sendOrganizationInvitation', () => {
    it('includes the organization name and accept URL', async () => {
      const sendSpy = jest.spyOn(service, 'send').mockResolvedValue(undefined);

      await service.sendOrganizationInvitation(
        'ada@example.com',
        'Acme Logistics',
        'https://app.escra.dev/invitations/accept?token=xyz',
      );

      const call = sendSpy.mock.calls[0]![0];
      expect(call.text).toContain('Acme Logistics');
      expect(call.html).toContain('Acme Logistics');
      expect(call.html).toContain('https://app.escra.dev/invitations/accept?token=xyz');
    });

    it('escapes an HTML-injecting organization name in the HTML body, but not the plain-text body', async () => {
      const sendSpy = jest.spyOn(service, 'send').mockResolvedValue(undefined);
      const maliciousName = '<img src=x onerror=alert(1)>';

      await service.sendOrganizationInvitation('ada@example.com', maliciousName, 'https://app.escra.dev/i');

      const call = sendSpy.mock.calls[0]![0];
      // The HTML body is an HTML-rendering context — this must be neutralized.
      expect(call.html).not.toContain('<img src=x onerror=alert(1)>');
      expect(call.html).toContain('&lt;img');
      // The plain-text body isn't HTML — the raw name is correct there.
      expect(call.text).toContain(maliciousName);
    });
  });

  describe('send (dev mode, no SMTP_HOST configured)', () => {
    it('logs instead of throwing when there is no transporter', async () => {
      await expect(
        service.send({ to: 'a@b.com', subject: 'Test', text: 'hi', html: '<p>hi</p>' }),
      ).resolves.toBeUndefined();
    });
  });
});
