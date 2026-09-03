import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type { EnvConfig } from '../config/env.validation';
import { escapeHtml } from '../common/html-escape.util';

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
      subject: 'Your ESCRA sign-in link',
      text: `Sign in to ESCRA: ${url}\n\nThis link expires shortly and can only be used once.`,
      html: `<p>Sign in to ESCRA:</p><p><a href="${url}">${url}</a></p><p>This link expires shortly and can only be used once.</p>`,
    });
  }

  async sendOrganizationInvitation(
    to: string,
    organizationName: string,
    url: string,
  ): Promise<void> {
    // organizationName is user-controlled (set at organization creation,
    // constrained only by length — see CreateOrganizationDto) and lands
    // directly in an HTML email body, so it must be escaped before
    // interpolation. `url` doesn't need this: it's always server-built
    // from a signed invitation token, never user input.
    const safeName = escapeHtml(organizationName);
    await this.send({
      to,
      subject: `You've been invited to join ${organizationName} on ESCRA`,
      text: `You've been invited to join ${organizationName} on ESCRA.\n\nAccept the invitation: ${url}`,
      html: `<p>You've been invited to join <strong>${safeName}</strong> on ESCRA.</p><p><a href="${url}">Accept the invitation</a></p>`,
    });
  }
}
