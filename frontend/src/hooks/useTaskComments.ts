import { useState, useEffect, useCallback } from 'react';
import { taskCommentService, TaskCommentWithUser } from '../services/taskCommentService';

export interface UseTaskCommentsResult {
  comments: TaskCommentWithUser[];
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  createComment: (content: string) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  refreshComments: () => Promise<void>;
}

export const useTaskComments = (taskId: string): UseTaskCommentsResult => {
  const [comments, setComments] = useState<TaskCommentWithUser[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!taskId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await taskCommentService.getTaskComments(taskId);
      setComments(result.comments);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const createComment = useCallback(async (content: string) => {
    if (!taskId) return;
    
    try {
      const newComment = await taskCommentService.createComment(taskId, content);
      setComments(prev => [newComment, ...prev]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comment');
      throw err;
    }
  }, [taskId]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    try {
      const updatedComment = await taskCommentService.updateComment(commentId, content);
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? updatedComment : comment
        )
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
      throw err;
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await taskCommentService.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      throw err;
    }
  }, []);

  const refreshComments = useCallback(async () => {
    await loadComments();
  }, [loadComments]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return {
    comments,
    hasMore,
    loading,
    error,
    createComment,
    updateComment,
    deleteComment,
    refreshComments
  };
};