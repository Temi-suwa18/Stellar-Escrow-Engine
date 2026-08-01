export interface OAuthProfile {
  provider: 'google' | 'github';
  providerAccountId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
}
