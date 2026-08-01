import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type { EnvConfig } from '../config/env.validation';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends transactional email (magic links, invitations, receipts) via SMTP
 * when configured. SMTP is optional in every non-production environment
 * (see env.validation.ts) — without it, this logs the email instead of
 * silently dropping it, so magic links and invites are still usable in
 * local dev without a real mail provider.
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly from: string;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    this.from = this.config.get('EMAIL_FROM', { infer: true });
  }

  onModuleInit(): void {
    const host = this.config.get('SMTP_HOST', { infer: true });
    if (!host) {
      this.logger.warn('SMTP_HOST not configured — outgoing email will be logged, not sent.');
      return;
    }

    this.transporter = createTransport({
      host,
      port: this.config.get('SMTP_PORT', { infer: true }),
      auth: {
        user: this.config.get('SMTP_USER', { infer: true }),
        pass: this.config.get('SMTP_PASSWORD', { infer: true }),
      },
    });
  }

  async send(input: SendEmailInput): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[dev email] to=${input.to} subject="${input.subject}"\n${input.text}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }

  async sendMagicLink(to: string, url: string): Promise<void> {
    await this.send({
      to,
      subject: 'Your Stellar Commerce sign-in link',
      text: `Sign in to Stellar Commerce: ${url}\n\nThis link expires shortly and can only be used once.`,
      html: `<p>Sign in to Stellar Commerce:</p><p><a href="${url}">${url}</a></p><p>This link expires shortly and can only be used once.</p>`,
    });
  }

  async sendOrganizationInvitation(
    to: string,
    organizationName: string,
    url: string,
  ): Promise<void> {
    await this.send({
      to,
      subject: `You've been invited to join ${organizationName} on Stellar Commerce`,
      text: `You've been invited to join ${organizationName} on Stellar Commerce.\n\nAccept the invitation: ${url}`,
      html: `<p>You've been invited to join <strong>${organizationName}</strong> on Stellar Commerce.</p><p><a href="${url}">Accept the invitation</a></p>`,
    });
  }
}
