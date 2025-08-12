import { Request, Response, NextFunction } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { AuthService } from '../services/authService';
import { User } from '../../../shared/src/types';

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

interface OIDCTokenPayload {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  azp?: string;
}

interface AuthenticatedRequest extends Request {
  user?: CognitoTokenPayload | OIDCTokenPayload;
  dbUser?: User;
}

// Create JWKS client for token verification
const JWKS = createRemoteJWKSet(new URL(`${process.env.OIDC_ISSUER_URL}/.well-known/jwks.json`));
const authService = new AuthService();

// In-memory cache to prevent duplicate user creation during race conditions
const userCreationCache = new Map<string, Promise<User>>();

const isCognitoToken = (payload: any): payload is CognitoTokenPayload => {
  return payload.token_use === 'access' && payload.client_id;
};

const isOIDCToken = (payload: any): payload is OIDCTokenPayload => {
  return payload.aud && !payload.token_use;
};

const extractUserInfo = (payload: CognitoTokenPayload | OIDCTokenPayload) => {
  console.log('Extracting user info from payload type:', isCognitoToken(payload) ? 'Cognito' : 'OIDC');

  if (isCognitoToken(payload)) {
    // For Cognito tokens, try multiple fields for email and name
    const email = payload.email || payload.username || payload.preferred_username;
    const name = payload.name || payload.preferred_username || payload.username;

    // If name is same as email, extract username part before @
    const finalName = name === email && email ? email.split('@')[0] : name;

    console.log('Cognito user info extracted:', {
      sub: payload.sub,
      email: email,
      name: finalName,
      originalEmail: payload.email,
      originalUsername: payload.username,
      originalPreferredUsername: payload.preferred_username,
      originalName: payload.name
    });

    return {
      sub: payload.sub,
      email: email || `user-${payload.sub.substring(0, 8)}@example.com`,
      name: finalName || 'Unknown User'
    };
  } else {
    // For standard OIDC tokens
    const email = payload.email;
    const name = payload.name ||
      (payload.given_name && payload.family_name ?
        `${payload.given_name} ${payload.family_name}` :
        payload.preferred_username || 'Unknown User');

    // If name is same as email, extract username part before @
    const finalName = name === email && email ? email.split('@')[0] : name;

    console.log('OIDC user info extracted:', {
      sub: payload.sub,
      email,
      name: finalName,
      originalEmail: payload.email,
      originalName: payload.name,
      originalGivenName: payload.given_name,
      originalFamilyName: payload.family_name,
      originalPreferredUsername: payload.preferred_username
    });

    return {
      sub: payload.sub,
      email: email || `user-${payload.sub.substring(0, 8)}@example.com`,
      name: finalName
    };
  }
};

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

    // Verify JWT token using OIDC JWKS
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.OIDC_ISSUER_URL,
    });

    let tokenPayload: CognitoTokenPayload | OIDCTokenPayload;

    if (isCognitoToken(payload)) {
      // Validate client_id for Cognito tokens
      if (payload.client_id !== process.env.OIDC_CLIENT_ID) {
        throw new Error('Invalid client_id');
      }
      tokenPayload = payload as CognitoTokenPayload;
    } else if (isOIDCToken(payload)) {
      // Validate audience for OIDC tokens
      const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!audience.includes(process.env.OIDC_CLIENT_ID!)) {
        throw new Error('Invalid audience');
      }
      tokenPayload = payload as OIDCTokenPayload;
    } else {
      throw new Error('Invalid token format');
    }

    req.user = tokenPayload;

    // Auto-create user if enabled and user doesn't exist
    if (process.env.AUTO_CREATE_USERS === 'true') {
      console.log('Raw token payload:', JSON.stringify(tokenPayload, null, 2));

      const userInfo = extractUserInfo(tokenPayload);

      if (userInfo.sub && userInfo.email) {
        try {
          console.log('Auto-creating/finding user:', {
            cognitoId: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name
          });

          // Check if there's already a user creation in progress for this cognitoId
          let userPromise = userCreationCache.get(userInfo.sub);
          
          if (!userPromise) {
            // Create a new promise for user creation and cache it
            userPromise = authService.getOrCreateUser({
              cognitoId: userInfo.sub,
              email: userInfo.email,
              name: userInfo.name
            });
            
            userCreationCache.set(userInfo.sub, userPromise);
            
            // Remove from cache after completion (success or failure)
            userPromise.finally(() => {
              userCreationCache.delete(userInfo.sub);
            });
          } else {
            console.log('User creation already in progress, waiting for existing promise');
          }

          const dbUser = await userPromise;

          console.log('User found/created:', {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name
          });

          req.dbUser = dbUser;
        } catch (error) {
          console.error('Error auto-creating user:', error);
          // Continue without failing the request - user creation is optional
        }
      } else {
        console.warn('Missing user info for auto-creation:', {
          sub: userInfo.sub,
          email: userInfo.email
        });
      }
    } else {
      console.log('Auto user creation is disabled');
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export { AuthenticatedRequest, CognitoTokenPayload, OIDCTokenPayload };