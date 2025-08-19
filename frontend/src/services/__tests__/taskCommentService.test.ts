import { taskCommentService } from '../taskCommentService';
import { apiClient } from '../apiClient';

// Mock apiClient
jest.mock('../apiClient');

describe('taskCommentService', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  const mockUser = {
    id: 'user-123',
    cognitoId: 'cognito-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockComment = {
    id: 'comment-123',
    taskId: 'task-123',
    userId: 'user-123',
    content: 'Test comment',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    user: mockUser
  };

  const mockCommentResponse = {
    id: 'comment-123',
    taskId: 'task-123',
    userId: 'user-123',
    content: 'Test comment',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    user: mockUser
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTaskComments', () => {
    it('should fetch task comments successfully', async () => {
      const mockResponse = {
        comments: [mockComment],
        hasMore: false
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse
      });

      const result = await taskCommentService.getTaskComments('task-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/comments/task/task-123');
      expect(result.comments).toHaveLength(1);
      expect(result.comments[0]).toEqual(mockCommentResponse);
      expect(result.hasMore).toBe(false);
    });

    it('should handle empty comments list', async () => {
      const mockResponse = {
        comments: [],
        hasMore: false
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse
      });

      const result = await taskCommentService.getTaskComments('task-123');

      expect(result.comments).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it('should handle pagination with hasMore flag', async () => {
      const mockResponse = {
        comments: [mockComment],
        hasMore: true
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse
      });

      const result = await taskCommentService.getTaskComments('task-123');

      expect(result.hasMore).toBe(true);
    });

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Task not found'));

      await expect(taskCommentService.getTaskComments('nonexistent'))
        .rejects.toThrow('Task not found');
    });

    it('should convert string dates to Date objects', async () => {
      const commentWithStringDates = {
        ...mockComment,
        createdAt: '2024-01-01T12:00:00.000Z',
        updatedAt: '2024-01-02T12:00:00.000Z'
      };

      mockApiClient.get.mockResolvedValue({
        data: { comments: [commentWithStringDates], hasMore: false }
      });

      const result = await taskCommentService.getTaskComments('task-123');

      expect(result.comments[0].createdAt).toBeInstanceOf(Date);
      expect(result.comments[0].updatedAt).toBeInstanceOf(Date);
      expect(result.comments[0].createdAt.toISOString()).toBe('2024-01-01T12:00:00.000Z');
      expect(result.comments[0].updatedAt.toISOString()).toBe('2024-01-02T12:00:00.000Z');
    });

    it('should handle invalid dates gracefully', async () => {
      const commentWithInvalidDates = {
        ...mockComment,
        createdAt: 'invalid-date',
        updatedAt: null
      };

      mockApiClient.get.mockResolvedValue({
        data: { comments: [commentWithInvalidDates], hasMore: false }
      });

      const result = await taskCommentService.getTaskComments('task-123');

      expect(result.comments[0].createdAt).toBeInstanceOf(Date);
      expect(result.comments[0].updatedAt).toBeInstanceOf(Date);
      // Should fallback to current date for invalid dates
      expect(result.comments[0].createdAt.getTime()).toBeCloseTo(Date.now(), -2); // Within 100ms
    });
  });

  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      mockApiClient.post.mockResolvedValue({
        data: { comment: mockComment }
      });

      const result = await taskCommentService.createComment('task-123', 'New comment');

      expect(mockApiClient.post).toHaveBeenCalledWith('/comments/task/task-123', {
        content: 'New comment'
      });
      expect(result).toEqual(mockCommentResponse);
    });

    it('should handle empty content', async () => {
      mockApiClient.post.mockResolvedValue({
        data: { comment: { ...mockComment, content: '' } }
      });

      const result = await taskCommentService.createComment('task-123', '');

      expect(result.content).toBe('');
    });

    it('should handle creation errors', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Content too long'));

      await expect(taskCommentService.createComment('task-123', 'Very long content'))
        .rejects.toThrow('Content too long');
    });

    it('should convert dates in created comment', async () => {
      const commentWithStringDates = {
        ...mockComment,
        createdAt: '2024-01-01T12:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z'
      };

      mockApiClient.post.mockResolvedValue({
        data: { comment: commentWithStringDates }
      });

      const result = await taskCommentService.createComment('task-123', 'New comment');

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateComment', () => {
    it('should update a comment successfully', async () => {
      const updatedComment = {
        ...mockComment,
        content: 'Updated comment',
        updatedAt: '2024-01-02T00:00:00.000Z'
      };

      mockApiClient.put.mockResolvedValue({
        data: { comment: updatedComment }
      });

      const result = await taskCommentService.updateComment('comment-123', 'Updated comment');

      expect(mockApiClient.put).toHaveBeenCalledWith('/comments/comment-123', {
        content: 'Updated comment'
      });
      expect(result.content).toBe('Updated comment');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle update errors', async () => {
      mockApiClient.put.mockRejectedValue(new Error('Comment not found'));

      await expect(taskCommentService.updateComment('nonexistent', 'Updated content'))
        .rejects.toThrow('Comment not found');
    });

    it('should handle permission errors', async () => {
      mockApiClient.put.mockRejectedValue(new Error('You can only update your own comments'));

      await expect(taskCommentService.updateComment('comment-123', 'Updated content'))
        .rejects.toThrow('You can only update your own comments');
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment successfully', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await taskCommentService.deleteComment('comment-123');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/comments/comment-123');
    });

    it('should handle deletion errors', async () => {
      mockApiClient.delete.mockRejectedValue(new Error('Comment not found'));

      await expect(taskCommentService.deleteComment('nonexistent'))
        .rejects.toThrow('Comment not found');
    });

    it('should handle permission errors', async () => {
      mockApiClient.delete.mockRejectedValue(new Error('You can only delete your own comments'));

      await expect(taskCommentService.deleteComment('comment-123'))
        .rejects.toThrow('You can only delete your own comments');
    });

    it('should handle network errors', async () => {
      mockApiClient.delete.mockRejectedValue(new Error('Network error'));

      await expect(taskCommentService.deleteComment('comment-123'))
        .rejects.toThrow('Network error');
    });
  });
});