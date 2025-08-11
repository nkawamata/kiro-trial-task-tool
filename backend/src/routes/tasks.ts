import { Router } from 'express';
import { TaskService } from '../services/taskService';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const taskService = new TaskService();

// Get tasks for current user
router.get('/user', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    
    const tasks = await taskService.getUserTasks(userId!);
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

// Get tasks for a project
router.get('/project/:projectId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const { projectId } = req.params;
    
    const tasks = await taskService.getProjectTasks(projectId, userId!);
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

// Create new task
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    
    const task = await taskService.createTask(req.body, userId!);
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

// Get task by ID
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const taskId = req.params.id;
    
    const task = await taskService.getTask(taskId, userId!);
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// Update task
router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const taskId = req.params.id;
    
    const task = await taskService.updateTask(taskId, req.body, userId!);
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const taskId = req.params.id;
    
    await taskService.deleteTask(taskId, userId!);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as taskRoutes };