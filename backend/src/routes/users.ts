import { Router } from 'express';
import { UserService } from '../services/userService';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const userService = new UserService();

// Get current user profile
router.get('/me', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const user = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/me', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const user = await userService.updateUserProfile(currentUser.id, req.body);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Search users (for project member assignment)
router.get('/search', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { q } = req.query;
    
    const users = await userService.searchUsers(q as string);
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };