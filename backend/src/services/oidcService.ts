import { jwtVerify, createRemoteJWKSet } from 'jose';

interface OIDCProviderConfig {
  issuerUrl: string;
  clientId: string;
  clientSecret?: string;
}

interface OIDCUserInfo {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export class OIDCService {
  private jwksCache = new Map<string, any>();

  private getJWKS(issuerUrl: string) {
    if (!this.jwksCache.has(issuerUrl)) {
      const jwks = createRemoteJWKSet(new URL(`${issuerUrl}/.well-known/jwks.json`));
      this.jwksCache.set(issuerUrl, jwks);
    }
    return this.jwksCache.get(issuerUrl);
  }

  async verifyToken(token: string, config: OIDCProviderConfig): Promise<OIDCUserInfo> {
    const jwks = this.getJWKS(config.issuerUrl);
    
    const { payload } = await jwtVerify(token, jwks, {
      issuer: config.issuerUrl,
      audience: config.clientId,
    });

    return this.extractUserInfo(payload);
  }

  private extractUserInfo(payload: any): OIDCUserInfo {
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || 
            (payload.given_name && payload.family_name ? 
             `${payload.given_name} ${payload.family_name}` : 
             payload.preferred_username),
      preferred_username: payload.preferred_username,
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture
    };
  }

  async getProviderInfo(issuerUrl: string): Promise<any> {
    try {
      const response = await fetch(`${issuerUrl}/.well-known/openid-configuration`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch OIDC provider info:', error);
      throw new Error('Invalid OIDC provider');
    }
  }

  // Helper method to detect provider type based on issuer
  getProviderType(issuerUrl: string): string {
    if (issuerUrl.includes('auth0.com')) return 'auth0';
    if (issuerUrl.includes('accounts.google.com')) return 'google';
    if (issuerUrl.includes('login.microsoftonline.com')) return 'microsoft';
    if (issuerUrl.includes('keycloak') || issuerUrl.includes('realms')) return 'keycloak';
    if (issuerUrl.includes('cognito')) return 'cognito';
    return 'generic';
  }

  // Provider-specific user info extraction
  extractProviderSpecificInfo(payload: any, providerType: string): OIDCUserInfo {
    const baseInfo = this.extractUserInfo(payload);

    switch (providerType) {
      case 'google':
        return {
          ...baseInfo,
          name: baseInfo.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
          picture: payload.picture
        };
      
      case 'microsoft':
        return {
          ...baseInfo,
          name: baseInfo.name || payload.name,
          preferred_username: payload.preferred_username || payload.upn
        };
      
      case 'auth0':
        return {
          ...baseInfo,
          name: baseInfo.name || payload.nickname,
          picture: payload.picture
        };
      
      case 'keycloak':
        return {
          ...baseInfo,
          name: baseInfo.name || payload.preferred_username,
          preferred_username: payload.preferred_username
        };
      
      default:
        return baseInfo;
    }
  }
}