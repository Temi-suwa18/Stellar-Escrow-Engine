import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthenticatedApiKey {
  id: string;
  organizationId: string;
  mode: 'TEST' | 'LIVE';
  scopes: string[];
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  apiKey?: AuthenticatedApiKey;
}
