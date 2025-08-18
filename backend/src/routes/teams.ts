import { Router } from 'express';
import { TeamsService } from '../services/teamsService';
import { UserService } from '../services/userService';
import { AuthenticatedRequest } from '../middleware/auth';
import { TeamRole } from '../../../shared/src/types';

const router = Router();
const teamsService = new TeamsService();
const userService = new UserService();

// Create team
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { name, description } = req.body;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    const team = await teamsService.createTeam(name, description, currentUser.id);
    res.status(201).json({ team });
  } catch (error) {
    next(error);
  }
});

// Get user's teams
router.get('/my-teams', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    const teams = await teamsService.getUserTeams(currentUser.id);
    res.json({ teams });
  } catch (error) {
    next(error);
  }
});

// Search teams
router.get('/search', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { q } = req.query;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    const teams = await teamsService.searchTeams(q, currentUser.id);
    res.json({ teams });
  } catch (error) {
    next(error);
  }
});

// Get team details
router.get('/:teamId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { teamId } = req.params;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    const team = await teamsService.getTeam(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user is a member of the team
    const userRole = await teamsService.getUserTeamRole(teamId, currentUser.id);
    if (!userRole) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ team, userRole });
  } catch (error) {
    next(error);
  }
});

// Update team
router.put('/:teamId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { teamId } = req.params;
    const { name, description } = req.body;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    const team = await teamsService.updateTeam(teamId, updates, currentUser.id);
    res.json({ team });
  } catch (error) {
    next(error);
  }
});

// Delete team
router.delete('/:teamId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { teamId } = req.params;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    await teamsService.deleteTeam(teamId, currentUser.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get team members
router.get('/:teamId/members', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { teamId } = req.params;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    // Check if user is a member of the team
    const userRole = await teamsService.getUserTeamRole(teamId, currentUser.id);
    if (!userRole) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = await teamsService.getTeamMembers(teamId);
    res.json({ members });
  } catch (error) {
    next(error);
  }
});

// Add team member
router.post('/:teamId/members', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { teamId } = req.params;
    const { userId, role } = req.body;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }

    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    const member = await teamsService.addTeamMember(teamId, userId, role, currentUser.id);
    res.status(201).json({ member });
  } catch (error) {
    next(error);
  }
});

// Remove team member
router.delete('/:teamId/members/:userId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { teamId, userId } = req.params;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    await teamsService.removeTeamMember(teamId, userId, currentUser.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Update team member role
router.put('/:teamId/members/:userId/role', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { teamId, userId } = req.params;
    const { role } = req.body;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    const member = await teamsService.updateTeamMemberRole(teamId, userId, role, currentUser.id);
    res.json({ member });
  } catch (error) {
    next(error);
  }
});

// Add team to project
router.post('/:teamId/projects/:projectId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { teamId, projectId } = req.params;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    const projectTeam = await teamsService.addTeamToProject(projectId, teamId, currentUser.id);
    res.status(201).json({ projectTeam });
  } catch (error) {
    next(error);
  }
});

// Remove team from project
router.delete('/:teamId/projects/:projectId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { teamId, projectId } = req.params;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    await teamsService.removeTeamFromProject(projectId, teamId, currentUser.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get teams associated with a project
router.get('/projects/:projectId/teams', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { projectId } = req.params;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    const projectTeams = await teamsService.getProjectTeams(projectId);
    res.json({ projectTeams });
  } catch (error) {
    next(error);
  }
});

export { router as teamsRoutes };