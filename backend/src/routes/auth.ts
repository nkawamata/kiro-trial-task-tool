import { Router } from 'express';
import { AuthService } from '../services/authService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const authService = new AuthService();

// OIDC/Cognito handles most auth operations, but we can sync user data
router.post('/sync-user', async (req, res, next) => {
  try {
    const { cognitoId, email, name } = req.body;
    
    const user = await authService.syncUser({
      cognitoId,
      email,
      name
    });
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Get current user info from token
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No user in token' });
    }

    // If auto-creation is enabled and user was created/found, return it
    if (req.dbUser) {
      return res.json({ 
        user: req.dbUser,
        tokenInfo: {
          sub: req.user.sub,
          email: req.user.email,
          name: req.user.name
        }
      });
    }

    // Otherwise, try to find user by cognitoId
    const dbUser = await authService.getUserFromToken(req.user.sub);
    
    if (dbUser) {
      res.json({ 
        user: dbUser,
        tokenInfo: {
          sub: req.user.sub,
          email: req.user.email,
          name: req.user.name
        }
      });
    } else {
      // User exists in OIDC but not in our database
      res.json({ 
        user: null,
        tokenInfo: {
          sub: req.user.sub,
          email: req.user.email,
          name: req.user.name
        },
        message: 'User authenticated but not found in database. Auto-creation may be disabled.'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Manual user creation endpoint (for when auto-creation is disabled)
router.post('/create-user', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No user in token' });
    }

    const userInfo = {
      cognitoId: req.user.sub,
      email: req.user.email || `user-${req.user.sub.substring(0, 8)}@example.com`,
      name: req.user.name || 'New User'
    };

    const user = await authService.getOrCreateUser(userInfo);
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };