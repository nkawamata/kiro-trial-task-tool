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

export { router as workloadRoutes };