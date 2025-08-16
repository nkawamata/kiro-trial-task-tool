import { Router } from 'express';
import { WorkloadService } from '../services/workloadService';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const workloadService = new WorkloadService();

// Get workload summary for user
router.get('/summary', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    const { startDate, endDate } = req.query;
    
    const summary = await workloadService.getUserWorkloadSummary(
      userId!,
      startDate as string,
      endDate as string
    );
    
    res.json({ summary });
  } catch (error) {
    next(error);
  }
});

// Get workload for multiple users (team view)
router.get('/team', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    
    const workload = await workloadService.getTeamWorkload(
      projectId as string,
      startDate as string,
      endDate as string
    );
    
    res.json({ workload });
  } catch (error) {
    next(error);
  }
});

// Get daily workload breakdown for team
router.get('/team/daily', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    
    const dailyWorkload = await workloadService.getTeamDailyWorkload(
      projectId as string,
      startDate as string,
      endDate as string
    );
    
    res.json({ dailyWorkload });
  } catch (error) {
    next(error);
  }
});

// Update workload allocation
router.post('/allocate', async (req: AuthenticatedRequest, res, next) => {
  try {
    const allocation = await workloadService.allocateWorkload(req.body);
    res.json({ allocation });
  } catch (error) {
    next(error);
  }
});

// Get workload distribution across projects
router.get('/distribution', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.sub;
    
    const distribution = await workloadService.getWorkloadDistribution(userId!);
    res.json({ distribution });
  } catch (error) {
    next(error);
  }
});

// Get workload entries for a date range
router.get('/entries', async (req: AuthenticatedRequest, res, next) => {
  try {
    // Allow userId to be passed as query parameter for testing
    const userId = req.query.userId as string || req.user?.sub;
    const { startDate, endDate } = req.query;
    
    console.log('Fetching workload entries:', { userId, startDate, endDate });
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const entries = await workloadService.getWorkloadEntries(
      userId,
      startDate as string,
      endDate as string
    );
    
    res.json({ entries });
  } catch (error) {
    next(error);
  }
});

// Get workload entries for a specific task
router.get('/task/:taskId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { taskId } = req.params;
    const { startDate, endDate } = req.query;
    
    const entries = await workloadService.getTaskWorkloadEntries(
      taskId,
      startDate as string,
      endDate as string
    );
    
    res.json({ entries });
  } catch (error) {
    next(error);
  }
});

// Update workload entry
router.patch('/:workloadId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { workloadId } = req.params;
    const updateData = req.body;
    
    // If only actualHours is provided, use the existing method
    if (Object.keys(updateData).length === 1 && updateData.actualHours !== undefined) {
      const workload = await workloadService.updateWorkloadActualHours(
        workloadId,
        updateData.actualHours
      );
      return res.json({ workload });
    }
    
    // Otherwise, use the new update method
    const workload = await workloadService.updateWorkloadEntry(workloadId, updateData);
    res.json({ workload });
  } catch (error) {
    next(error);
  }
});

// Delete workload entry
router.delete('/:workloadId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { workloadId } = req.params;
    
    await workloadService.deleteWorkloadEntry(workloadId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as workloadRoutes };