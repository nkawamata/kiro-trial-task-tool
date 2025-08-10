import { Router } from 'express';
import { AuthService } from '../services/authService';

const router = Router();
const authService = new AuthService();

// Cognito handles most auth operations, but we can sync user data
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

router.get('/me', async (req, res, next) => {
  try {
    // This would typically use the auth middleware
    // For now, return user info based on token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Extract user info from token and return user data
    res.json({ message: 'User info endpoint - implement with auth middleware' });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };