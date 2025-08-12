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
    const cognitoId = req.user?.sub;
    const { projectId } = req.params;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get database user ID from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
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
    const cognitoId = req.user?.sub;
    const { projectId } = req.params;
    const { userId: memberUserId, role } = req.body;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get database user ID from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    // Check if user can manage team
    const canManage = await teamService.canUserManageTeam(projectId, currentUser.id);
    if (!canManage) {
      return res.status(403).json({ error: 'Insufficient permissions to manage team' });
    }

    const member = await teamService.addProjectMember(projectId, memberUserId, role, currentUser.id);
    res.status(201).json({ member });
  } catch (error) {
    next(error);
  }
});

// Remove project member
router.delete('/projects/:projectId/members/:userId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { projectId, userId } = req.params;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get database user ID from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    // Check if user can manage team
    const canManage = await teamService.canUserManageTeam(projectId, currentUser.id);
    if (!canManage) {
      return res.status(403).json({ error: 'Insufficient permissions to manage team' });
    }

    await teamService.removeProjectMember(projectId, userId, currentUser.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Update member role
router.put('/projects/:projectId/members/:userId/role', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { projectId, userId } = req.params;
    const { role } = req.body;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get database user ID from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    // Check if user can manage team
    const canManage = await teamService.canUserManageTeam(projectId, currentUser.id);
    if (!canManage) {
      return res.status(403).json({ error: 'Insufficient permissions to manage team' });
    }

    const member = await teamService.updateMemberRole(projectId, userId, role, currentUser.id);
    res.json({ member });
  } catch (error) {
    next(error);
  }
});

// Debug endpoint to list all users (temporarily without auth for testing)
router.get('/users/debug/all', async (req, res, next) => {
  try {
    console.log('Debug: Listing all users');
    const users = await userService.getAllUsers();
    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Debug all users error:', error);
    next(error);
  }
});

// Debug endpoint to test search (temporarily without auth for testing)
router.get('/users/debug/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log('Debug: Searching users with query:', q);
    const users = await userService.searchUsers(q);
    console.log('Debug: Search results:', users.map(u => ({ id: u.id, email: u.email, name: u.name })));
    
    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Debug search error:', error);
    next(error);
  }
});

// Search users for adding to project
router.get('/users/search', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { q } = req.query;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify user exists in database
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log('Searching users with query:', q);
    console.log('Current user:', { id: currentUser.id, email: currentUser.email, name: currentUser.name });
    
    const users = await userService.searchUsers(q);
    console.log('Search results:', users.map(u => ({ id: u.id, email: u.email, name: u.name })));
    
    res.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    next(error);
  }
});

export { router as teamRoutes };