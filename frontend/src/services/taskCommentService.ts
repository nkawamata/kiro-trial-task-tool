import { TaskComment, User } from '../../../shared/src/types';
import { apiClient } from './apiClient';

export interface TaskCommentWithUser extends TaskComment {
  user?: User;
}

export interface TaskCommentsResponse {
  comments: TaskCommentWithUser[];
  hasMore: boolean;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// Helper function to convert API response dates to Date objects
const convertCommentDates = (comment: any): TaskCommentWithUser => {
  const createdAt = comment.createdAt ? new Date(comment.createdAt) : new Date();
  const updatedAt = comment.updatedAt ? new Date(comment.updatedAt) : new Date();
  
  // Validate dates and fallback to current date if invalid
  const validCreatedAt = isNaN(createdAt.getTime()) ? new Date() : createdAt;
  const validUpdatedAt = isNaN(updatedAt.getTime()) ? new Date() : updatedAt;
  
  return {
    ...comment,
    createdAt: validCreatedAt,
    updatedAt: validUpdatedAt
  };
};

export const taskCommentService = {
  async getTaskComments(taskId: string): Promise<TaskCommentsResponse> {
    const response = await apiClient.get(`/comments/task/${taskId}`);
    return {
      ...response.data,
      comments: response.data.comments.map(convertCommentDates)
    };
  },

  async createComment(taskId: string, content: string): Promise<TaskCommentWithUser> {
    const response = await apiClient.post(`/comments/task/${taskId}`, { content });
    return convertCommentDates(response.data.comment);
  },

  async updateComment(commentId: string, content: string): Promise<TaskCommentWithUser> {
    const response = await apiClient.put(`/comments/${commentId}`, { content });
    return convertCommentDates(response.data.comment);
  },

  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/comments/${commentId}`);
  }
};