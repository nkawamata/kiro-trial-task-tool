import { Router } from 'express';
import { UserService } from '../services/userService';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const userService = new UserService();

// Get current user profile
router.get('/me', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await userService.getUserProfile(userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/me', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await userService.updateUserProfile(userId, req.body);
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