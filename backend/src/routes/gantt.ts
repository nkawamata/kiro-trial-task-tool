import { Router } from 'express';
import { GanttService } from '../services/ganttService';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const ganttService = new GanttService();

// Get Gantt chart data for project
router.get('/project/:projectId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const { projectId } = req.params;
    
    const ganttData = await ganttService.getProjectGanttData(projectId, userId!);
    res.json({ ganttData });
  } catch (error) {
    next(error);
  }
});

// Get multi-project Gantt view
router.get('/multi-project', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const { projectIds } = req.query;
    
    const ganttData = await ganttService.getMultiProjectGanttData(
      (projectIds as string).split(','),
      userId!
    );
    
    res.json({ ganttData });
  } catch (error) {
    next(error);
  }
});

// Update task timeline
router.put('/task/:taskId/timeline', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const { taskId } = req.params;
    const { startDate, endDate } = req.body;
    
    const updatedTask = await ganttService.updateTaskTimeline(
      taskId,
      startDate,
      endDate,
      userId!
    );
    
    res.json({ task: updatedTask });
  } catch (error) {
    next(error);
  }
});

export { router as ganttRoutes };