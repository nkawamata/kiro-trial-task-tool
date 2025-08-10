import { Router } from 'express';
import { ProjectService } from '../services/projectService';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const projectService = new ProjectService();

// Get all projects for user
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const projects = await projectService.getUserProjects(userId);
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

// Create new project
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { teamMembers, ...projectData } = req.body;
    
    let project;
    if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
      // Create project with team members
      project = await projectService.createProjectWithTeam({
        ...projectData,
        ownerId: userId
      }, teamMembers);
    } else {
      // Create project without additional team members (owner will still be added automatically)
      project = await projectService.createProject({
        ...projectData,
        ownerId: userId
      });
    }
    
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

// Get project by ID
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const projectId = req.params.id;
    
    const project = await projectService.getProject(projectId, userId!);
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const projectId = req.params.id;
    
    const project = await projectService.updateProject(projectId, req.body, userId!);
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const projectId = req.params.id;
    
    await projectService.deleteProject(projectId, userId!);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as projectRoutes };