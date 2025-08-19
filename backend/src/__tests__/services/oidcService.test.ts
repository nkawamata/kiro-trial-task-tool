import { OIDCService } from '../../services/oidcService';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Mock jose library
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('OIDCService', () => {
  let oidcService: OIDCService;
  const mockJwtVerify = jwtVerify as jest.MockedFunction<typeof jwtVerify>;
  const mockCreateRemoteJWKSet = createRemoteJWKSet as jest.MockedFunction<typeof createRemoteJWKSet>;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  const mockConfig = {
    issuerUrl: 'https://example.com',
    clientId: 'test-client-id',
    clientSecret: 'test-secret'
  };

  const mockPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    preferred_username: 'testuser',
    given_name: 'Test',
    family_name: 'User',
    picture: 'https://example.com/avatar.jpg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    oidcService = new OIDCService();
  });

  describe('verifyToken', () => {
    it('should verify token and return user info', async () => {
      const mockJwks = jest.fn();
      mockCreateRemoteJWKSet.mockReturnValue(mockJwks);
      mockJwtVerify.mockResolvedValue({ payload: mockPayload } as any);

      const result = await oidcService.verifyToken('test-token', mockConfig);

      expect(mockCreateRemoteJWKSet).toHaveBeenCalledWith(
        new URL('https://example.com/.well-known/jwks.json')
      );
      expect(mockJwtVerify).toHaveBeenCalledWith('test-token', mockJwks, {
        issuer: 'https://example.com',
        audience: 'test-client-id'
      });
      expect(result).toEqual({
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        preferred_username: 'testuser',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/avatar.jpg'
      });
    });

    it('should cache JWKS for the same issuer', async () => {
      const mockJwks = jest.fn();
      mockCreateRemoteJWKSet.mockReturnValue(mockJwks);
      mockJwtVerify.mockResolvedValue({ payload: mockPayload } as any);

      // First call
      await oidcService.verifyToken('token1', mockConfig);
      // Second call with same issuer
      await oidcService.verifyToken('token2', mockConfig);

      expect(mockCreateRemoteJWKSet).toHaveBeenCalledTimes(1);
    });

    it('should handle token verification errors', async () => {
      const mockJwks = jest.fn();
      mockCreateRemoteJWKSet.mockReturnValue(mockJwks);
      mockJwtVerify.mockRejectedValue(new Error('Invalid token'));

      await expect(oidcService.verifyToken('invalid-token', mockConfig))
        .rejects.toThrow('Invalid token');
    });

    it('should extract name from given_name and family_name when name is missing', async () => {
      const payloadWithoutName = {
        ...mockPayload,
        name: undefined,
        given_name: 'John',
        family_name: 'Doe'
      };

      const mockJwks = jest.fn();
      mockCreateRemoteJWKSet.mockReturnValue(mockJwks);
      mockJwtVerify.mockResolvedValue({ payload: payloadWithoutName } as any);

      const result = await oidcService.verifyToken('test-token', mockConfig);

      expect(result.name).toBe('John Doe');
    });

    it('should fallback to preferred_username when name components are missing', async () => {
      const payloadMinimal = {
        sub: 'user-123',
        preferred_username: 'johndoe'
      };

      const mockJwks = jest.fn();
      mockCreateRemoteJWKSet.mockReturnValue(mockJwks);
      mockJwtVerify.mockResolvedValue({ payload: payloadMinimal } as any);

      const result = await oidcService.verifyToken('test-token', mockConfig);

      expect(result.name).toBe('johndoe');
    });
  });

  describe('getProviderInfo', () => {
    it('should fetch and return provider configuration', async () => {
      const mockProviderInfo = {
        issuer: 'https://example.com',
        authorization_endpoint: 'https://example.com/auth',
        token_endpoint: 'https://example.com/token'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockProviderInfo)
      } as Response);

      const result = await oidcService.getProviderInfo('https://example.com');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/.well-known/openid-configuration');
      expect(result).toEqual(mockProviderInfo);
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(oidcService.getProviderInfo('https://invalid.com'))
        .rejects.toThrow('Invalid OIDC provider');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch OIDC provider info:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getProviderType', () => {
    it('should detect Auth0 provider', () => {
      expect(oidcService.getProviderType('https://dev-123.auth0.com')).toBe('auth0');
    });

    it('should detect Google provider', () => {
      expect(oidcService.getProviderType('https://accounts.google.com')).toBe('google');
    });

    it('should detect Microsoft provider', () => {
      expect(oidcService.getProviderType('https://login.microsoftonline.com/tenant')).toBe('microsoft');
    });

    it('should detect Keycloak provider', () => {
      expect(oidcService.getProviderType('https://keycloak.example.com/realms/test')).toBe('keycloak');
    });

    it('should detect Cognito provider', () => {
      expect(oidcService.getProviderType('https://cognito-idp.us-east-1.amazonaws.com')).toBe('cognito');
    });

    it('should return generic for unknown providers', () => {
      expect(oidcService.getProviderType('https://unknown-provider.com')).toBe('generic');
    });
  });

  describe('extractProviderSpecificInfo', () => {
    it('should extract Google-specific info', () => {
      const googlePayload = {
        sub: 'google-123',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://google.com/avatar.jpg'
      };

      const result = oidcService.extractProviderSpecificInfo(googlePayload, 'google');

      expect(result.name).toBe('John Doe');
      expect(result.picture).toBe('https://google.com/avatar.jpg');
    });

    it('should extract Microsoft-specific info', () => {
      const msPayload = {
        sub: 'ms-123',
        name: 'John Doe',
        preferred_username: 'john@company.com',
        upn: 'john@company.com'
      };

      const result = oidcService.extractProviderSpecificInfo(msPayload, 'microsoft');

      expect(result.name).toBe('John Doe');
      expect(result.preferred_username).toBe('john@company.com');
    });

    it('should extract Auth0-specific info', () => {
      const auth0Payload = {
        sub: 'auth0-123',
        nickname: 'johndoe',
        picture: 'https://auth0.com/avatar.jpg'
      };

      const result = oidcService.extractProviderSpecificInfo(auth0Payload, 'auth0');

      expect(result.name).toBe('johndoe');
      expect(result.picture).toBe('https://auth0.com/avatar.jpg');
    });

    it('should extract Keycloak-specific info', () => {
      const keycloakPayload = {
        sub: 'keycloak-123',
        preferred_username: 'johndoe'
      };

      const result = oidcService.extractProviderSpecificInfo(keycloakPayload, 'keycloak');

      expect(result.name).toBe('johndoe');
      expect(result.preferred_username).toBe('johndoe');
    });

    it('should return base info for generic providers', () => {
      const genericPayload = {
        sub: 'generic-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const result = oidcService.extractProviderSpecificInfo(genericPayload, 'generic');

      expect(result).toEqual({
        sub: 'generic-123',
        email: 'test@example.com',
        name: 'Test User',
        preferred_username: undefined,
        given_name: undefined,
        family_name: undefined,
        picture: undefined
      });
    });
  });
});