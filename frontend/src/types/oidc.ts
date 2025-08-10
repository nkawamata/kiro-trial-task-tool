// OIDC User type definitions
export interface OIDCUser {
  sub: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  profile?: {
    sub: string;
    email?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    preferred_username?: string;
  };
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_at?: number;
  [key: string]: any;
}