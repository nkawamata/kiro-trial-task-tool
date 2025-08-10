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
    
    const project = await projectService.createProject({
      ...req.body,
      ownerId: userId
    });
    
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