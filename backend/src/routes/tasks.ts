import { Router } from 'express';
import { TaskService } from '../services/taskService';
import { UserService } from '../services/userService';
import { TaskWorkloadIntegrationService } from '../services/taskWorkloadIntegrationService';
import { TeamService } from '../services/teamService';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const taskService = new TaskService();
const userService = new UserService();
const taskWorkloadIntegrationService = new TaskWorkloadIntegrationService();
const teamService = new TeamService();

// Get tasks for current user
router.get('/user', async (req: AuthenticatedRequest, res, next) => {
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
    
    const tasks = await taskService.getUserTasks(currentUser.id);
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

// Get tasks for a project
router.get('/project/:projectId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { projectId } = req.params;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const tasks = await taskService.getProjectTasks(projectId, currentUser.id);
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

// Create new task
router.post('/', async (req: AuthenticatedRequest, res, next) => {
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
    
    const task = await taskService.createTask(req.body, currentUser.id);
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

// Get task by ID
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const taskId = req.params.id;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const task = await taskService.getTask(taskId, currentUser.id);
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// Update task
router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const taskId = req.params.id;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const task = await taskService.updateTask(taskId, req.body, currentUser.id);
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const taskId = req.params.id;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    await taskService.deleteTask(taskId, currentUser.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Assign task with automatic workload allocation
router.post('/:id/assign-with-workload', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const taskId = req.params.id;
    const { assigneeId, distributionStrategy, customDistribution, autoAllocate } = req.body;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const result = await taskWorkloadIntegrationService.assignTaskWithWorkload(
      taskId,
      assigneeId,
      currentUser.id,
      {
        distributionStrategy,
        customDistribution,
        autoAllocate
      }
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get assignment suggestions for a task
router.get('/:id/assignment-suggestions', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const taskId = req.params.id;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    // Get task to find project
    const task = await taskService.getTask(taskId, currentUser.id);
    
    // Get project members
    const projectMembers = await teamService.getProjectMembers(task.projectId);
    const memberIds = projectMembers.map(member => member.userId);
    
    const suggestions = await taskWorkloadIntegrationService.getAssignmentSuggestions(
      taskId,
      currentUser.id,
      memberIds
    );
    
    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
});

// Get workload impact preview for assigning a task
router.get('/:id/workload-impact/:assigneeId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { id: taskId, assigneeId } = req.params;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const impact = await taskWorkloadIntegrationService.getWorkloadImpact(
      taskId,
      assigneeId,
      currentUser.id
    );
    
    res.json({ impact });
  } catch (error) {
    next(error);
  }
});

// Get user capacity information
router.get('/capacity/:userId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const capacity = await taskWorkloadIntegrationService.getUserCapacityInfo(
      userId,
      start,
      end
    );
    
    res.json({ capacity });
  } catch (error) {
    next(error);
  }
});

export { router as taskRoutes };