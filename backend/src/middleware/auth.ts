import { Request, Response, NextFunction } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';

interface CognitoTokenPayload {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  username?: string;
  iss: string;
  client_id: string;
  token_use: string;
  scope: string;
  exp: number;
  iat: number;
  jti: string;
}

interface AuthenticatedRequest extends Request {
  user?: CognitoTokenPayload;
}

// Create JWKS client for token verification
const JWKS = createRemoteJWKSet(new URL(`${process.env.OIDC_ISSUER_URL}/.well-known/jwks.json`));

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token using Cognito JWKS
    // Note: Cognito access tokens don't have 'aud' claim, they use 'client_id'
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.OIDC_ISSUER_URL,
      // Don't validate audience for Cognito access tokens
    });
    
    const cognitoPayload = payload as unknown as CognitoTokenPayload;
    
    // Validate client_id manually for Cognito tokens
    if (cognitoPayload.client_id !== process.env.OIDC_CLIENT_ID) {
      throw new Error('Invalid client_id');
    }
    
    // Ensure this is an access token
    if (cognitoPayload.token_use !== 'access') {
      throw new Error('Invalid token type, expected access token');
    }
    
    req.user = cognitoPayload;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export { AuthenticatedRequest, CognitoTokenPayload };