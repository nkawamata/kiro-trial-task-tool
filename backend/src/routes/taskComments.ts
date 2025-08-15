import { Router } from 'express';
import { TaskCommentService } from '../services/taskCommentService';
import { UserService } from '../services/userService';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const taskCommentService = new TaskCommentService();
const userService = new UserService();

// Get comments for a task
router.get('/task/:taskId', async (req: AuthenticatedRequest, res) => {
  try {
    const { taskId } = req.params;
    const cognitoId = req.user?.sub;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const result = await taskCommentService.getCommentsWithTruncation(taskId, currentUser.id);
    res.json(result);
  } catch (error) {
    console.error('Error fetching task comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create a new comment
router.post('/task/:taskId', async (req: AuthenticatedRequest, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const cognitoId = req.user?.sub;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({ error: 'Comment content must be less than 1000 characters' });
    }
    
    const comment = await taskCommentService.createComment(taskId, content, currentUser.id);
    res.status(201).json({ comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Update a comment
router.put('/:commentId', async (req: AuthenticatedRequest, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const cognitoId = req.user?.sub;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({ error: 'Comment content must be less than 1000 characters' });
    }
    
    const comment = await taskCommentService.updateComment(commentId, content, currentUser.id);
    res.json({ comment });
  } catch (error) {
    console.error('Error updating comment:', error);
    if (error instanceof Error && error.message === 'You can only update your own comments') {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update comment' });
    }
  }
});

// Delete a comment
router.delete('/:commentId', async (req: AuthenticatedRequest, res) => {
  try {
    const { commentId } = req.params;
    const cognitoId = req.user?.sub;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    await taskCommentService.deleteComment(commentId, currentUser.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting comment:', error);
    if (error instanceof Error && error.message === 'You can only delete your own comments') {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  }
});

export { router as taskCommentRoutes };