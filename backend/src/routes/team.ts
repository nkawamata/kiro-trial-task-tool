import { Router } from 'express';
import { TeamService } from '../services/teamService';
import { UserService } from '../services/userService';
import { AuthenticatedRequest } from '../middleware/auth';
import { ProjectRole } from '../../../shared/src/types';

const router = Router();
const teamService = new TeamService();
const userService = new UserService();

// Get project members
router.get('/projects/:projectId/members', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const { projectId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const members = await teamService.getProjectMembers(projectId);
    res.json({ members });
  } catch (error) {
    next(error);
  }
});

// Add project member
router.post('/projects/:projectId/members', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const { projectId } = req.params;
    const { userId: memberUserId, role } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user can manage team
    const canManage = await teamService.canUserManageTeam(projectId, userId);
    if (!canManage) {
      return res.status(403).json({ error: 'Insufficient permissions to manage team' });
    }

    const member = await teamService.addProjectMember(projectId, memberUserId, role, userId);
    res.status(201).json({ member });
  } catch (error) {
    next(error);
  }
});

// Remove project member
router.delete('/projects/:projectId/members/:userId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const currentUserId = req.user?.sub;
    const { projectId, userId } = req.params;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user can manage team
    const canManage = await teamService.canUserManageTeam(projectId, currentUserId);
    if (!canManage) {
      return res.status(403).json({ error: 'Insufficient permissions to manage team' });
    }

    await teamService.removeProjectMember(projectId, userId, currentUserId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Update member role
router.put('/projects/:projectId/members/:userId/role', async (req: AuthenticatedRequest, res, next) => {
  try {
    const currentUserId = req.user?.sub;
    const { projectId, userId } = req.params;
    const { role } = req.body;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user can manage team
    const canManage = await teamService.canUserManageTeam(projectId, currentUserId);
    if (!canManage) {
      return res.status(403).json({ error: 'Insufficient permissions to manage team' });
    }

    const member = await teamService.updateMemberRole(projectId, userId, role, currentUserId);
    res.json({ member });
  } catch (error) {
    next(error);
  }
});

// Search users for adding to project
router.get('/users/search', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const { q } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const users = await userService.searchUsers(q);
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

export { router as teamRoutes };