import { Router } from 'express';
import { ProjectService } from '../services/projectService';
import { UserService } from '../services/userService';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const projectService = new ProjectService();
const userService = new UserService();

// Get all projects for user
router.get('/', async (req: AuthenticatedRequest, res, next) => {
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
    
    const projects = await projectService.getUserProjects(currentUser.id);
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

// Create new project
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    console.log('POST /api/projects - cognitoId:', cognitoId);
    console.log('POST /api/projects - req.dbUser:', req.dbUser ? { id: req.dbUser.id, email: req.dbUser.email } : 'null');
    
    if (!cognitoId) {
      console.log('POST /api/projects - No cognitoId, returning 401');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    console.log('POST /api/projects - currentUser:', currentUser ? { id: currentUser.id, email: currentUser.email } : 'null');
    
    if (!currentUser) {
      console.log('POST /api/projects - User not found in database, returning 404');
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const { teamMembers, ...projectData } = req.body;
    console.log('POST /api/projects - Creating project with data:', projectData);
    
    let project;
    if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
      // Create project with team members
      project = await projectService.createProjectWithTeam({
        ...projectData,
        ownerId: currentUser.id
      }, teamMembers);
    } else {
      // Create project without additional team members (owner will still be added automatically)
      project = await projectService.createProject({
        ...projectData,
        ownerId: currentUser.id
      });
    }
    
    console.log('POST /api/projects - Project created successfully:', { id: project.id, name: project.name });
    res.status(201).json({ project });
  } catch (error) {
    console.error('POST /api/projects - Error:', error);
    next(error);
  }
});

// Get project by ID
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const projectId = req.params.id;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const project = await projectService.getProject(projectId, currentUser.id);
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const projectId = req.params.id;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const project = await projectService.updateProject(projectId, req.body, currentUser.id);
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const projectId = req.params.id;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    await projectService.deleteProject(projectId, currentUser.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as projectRoutes };