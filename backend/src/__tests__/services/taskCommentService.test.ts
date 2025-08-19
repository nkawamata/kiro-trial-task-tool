import { TaskCommentService, TaskCommentWithUser } from '../../services/taskCommentService';
import { TaskService } from '../../services/taskService';
import { UserService } from '../../services/userService';
import { TaskComment, User } from '../../../../shared/src/types';

// Mock dependencies
jest.mock('../../services/taskService');
jest.mock('../../services/userService');
jest.mock('../../config/dynamodb', () => ({
  dynamoDb: {
    send: jest.fn()
  },
  TABLES: {
    TASK_COMMENTS: 'task-comments-table'
  }
}));

const { dynamoDb, TABLES } = require('../../config/dynamodb');

describe('TaskCommentService', () => {
  let taskCommentService: TaskCommentService;
  let mockTaskService: jest.Mocked<TaskService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockDynamoDb: { send: jest.MockedFunction<any> };

  const mockUser: User = {
    id: 'user-123',
    cognitoId: 'cognito-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockComment: TaskComment = {
    id: 'comment-123',
    taskId: 'task-123',
    userId: 'user-123',
    content: 'Test comment',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  };

  const mockDbComment = {
    ...mockComment,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    taskCommentService = new TaskCommentService();
    mockTaskService = (taskCommentService as any).taskService;
    mockUserService = (taskCommentService as any).userService;
    mockDynamoDb = dynamoDb;
  });

  describe('getTaskComments', () => {
    it('should return comments with user details', async () => {
      mockTaskService.getTask.mockResolvedValue({} as any);
      mockDynamoDb.send.mockResolvedValue({ Items: [mockDbComment] });
      mockUserService.getUser.mockResolvedValue(mockUser);

      const result = await taskCommentService.getTaskComments('task-123', 'user-123');

      expect(mockTaskService.getTask).toHaveBeenCalledWith('task-123', 'user-123');
      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.TASK_COMMENTS,
            IndexName: 'TaskIndex',
            KeyConditionExpression: 'taskId = :taskId',
            ExpressionAttributeValues: { ':taskId': 'task-123' },
            ScanIndexForward: false,
            Limit: 10
          })
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockComment,
        user: mockUser
      });
    });

    it('should handle comments with missing users', async () => {
      mockTaskService.getTask.mockResolvedValue({} as any);
      mockDynamoDb.send.mockResolvedValue({ Items: [mockDbComment] });
      mockUserService.getUser.mockRejectedValue(new Error('User not found'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await taskCommentService.getTaskComments('task-123', 'user-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockComment);
      expect(result[0].user).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('User not found for comment comment-123'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should respect limit parameter', async () => {
      mockTaskService.getTask.mockResolvedValue({} as any);
      mockDynamoDb.send.mockResolvedValue({ Items: [] });

      await taskCommentService.getTaskComments('task-123', 'user-123', 5);

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Limit: 5
          })
        })
      );
    });

    it('should throw error when user has no access to task', async () => {
      mockTaskService.getTask.mockRejectedValue(new Error('Access denied'));

      await expect(taskCommentService.getTaskComments('task-123', 'user-123'))
        .rejects.toThrow('Access denied');
    });
  });

  describe('createComment', () => {
    it('should create a new comment', async () => {
      mockTaskService.getTask.mockResolvedValue({} as any);
      mockDynamoDb.send.mockResolvedValue({});
      mockUserService.getUser.mockResolvedValue(mockUser);

      const result = await taskCommentService.createComment('task-123', 'New comment', 'user-123');

      expect(mockTaskService.getTask).toHaveBeenCalledWith('task-123', 'user-123');
      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.TASK_COMMENTS,
            Item: expect.objectContaining({
              taskId: 'task-123',
              userId: 'user-123',
              content: 'New comment'
            })
          })
        })
      );
      expect(result.id).toBeDefined();
      expect(result.content).toBe('New comment');
      expect(result.user).toEqual(mockUser);
    });

    it('should trim comment content', async () => {
      mockTaskService.getTask.mockResolvedValue({} as any);
      mockDynamoDb.send.mockResolvedValue({});
      mockUserService.getUser.mockResolvedValue(mockUser);

      const result = await taskCommentService.createComment('task-123', '  Trimmed comment  ', 'user-123');

      expect(result.content).toBe('Trimmed comment');
    });

    it('should handle missing user during creation', async () => {
      mockTaskService.getTask.mockResolvedValue({} as any);
      mockDynamoDb.send.mockResolvedValue({});
      mockUserService.getUser.mockRejectedValue(new Error('User not found'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await taskCommentService.createComment('task-123', 'New comment', 'user-123');

      expect(result.user).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('updateComment', () => {
    it('should update comment content', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: mockDbComment }) // getComment
        .mockResolvedValueOnce({ Attributes: { ...mockDbComment, content: 'Updated content' } }); // update
      mockTaskService.getTask.mockResolvedValue({} as any);
      mockUserService.getUser.mockResolvedValue(mockUser);

      const result = await taskCommentService.updateComment('comment-123', 'Updated content', 'user-123');

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.TASK_COMMENTS,
            Key: { id: 'comment-123' },
            UpdateExpression: 'SET content = :content, updatedAt = :updatedAt',
            ExpressionAttributeValues: expect.objectContaining({
              ':content': 'Updated content'
            })
          })
        })
      );
      expect(result.user).toEqual(mockUser);
    });

    it('should throw error when user is not comment author', async () => {
      const otherUserComment = { ...mockDbComment, userId: 'other-user' };
      mockDynamoDb.send.mockResolvedValue({ Item: otherUserComment });
      mockTaskService.getTask.mockResolvedValue({} as any);

      await expect(
        taskCommentService.updateComment('comment-123', 'Updated content', 'user-123')
      ).rejects.toThrow('You can only update your own comments');
    });

    it('should trim updated content', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: mockDbComment })
        .mockResolvedValueOnce({ Attributes: mockDbComment });
      mockTaskService.getTask.mockResolvedValue({} as any);
      mockUserService.getUser.mockResolvedValue(mockUser);

      await taskCommentService.updateComment('comment-123', '  Trimmed update  ', 'user-123');

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            ExpressionAttributeValues: expect.objectContaining({
              ':content': 'Trimmed update'
            })
          })
        })
      );
    });
  });

  describe('deleteComment', () => {
    it('should delete comment', async () => {
      mockDynamoDb.send
        .mockResolvedValueOnce({ Item: mockDbComment }) // getComment
        .mockResolvedValueOnce({}); // delete
      mockTaskService.getTask.mockResolvedValue({} as any);

      await taskCommentService.deleteComment('comment-123', 'user-123');

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.TASK_COMMENTS,
            Key: { id: 'comment-123' }
          })
        })
      );
    });

    it('should throw error when user is not comment author', async () => {
      const otherUserComment = { ...mockDbComment, userId: 'other-user' };
      mockDynamoDb.send.mockResolvedValue({ Item: otherUserComment });
      mockTaskService.getTask.mockResolvedValue({} as any);

      await expect(
        taskCommentService.deleteComment('comment-123', 'user-123')
      ).rejects.toThrow('You can only delete your own comments');
    });
  });

  describe('getComment', () => {
    it('should return comment when found', async () => {
      mockDynamoDb.send.mockResolvedValue({ Item: mockDbComment });
      mockTaskService.getTask.mockResolvedValue({} as any);

      const result = await taskCommentService.getComment('comment-123', 'user-123');

      expect(mockDynamoDb.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: TABLES.TASK_COMMENTS,
            Key: { id: 'comment-123' }
          })
        })
      );
      expect(mockTaskService.getTask).toHaveBeenCalledWith('task-123', 'user-123');
      expect(result).toEqual(mockComment);
    });

    it('should throw error when comment not found', async () => {
      mockDynamoDb.send.mockResolvedValue({ Item: null });

      await expect(taskCommentService.getComment('nonexistent', 'user-123'))
        .rejects.toThrow('Comment not found');
    });
  });

  describe('getCommentsWithTruncation', () => {
    it('should return comments with hasMore flag', async () => {
      const comments = Array.from({ length: 11 }, (_, i) => ({
        ...mockComment,
        id: `comment-${i}`,
        user: mockUser
      }));

      jest.spyOn(taskCommentService, 'getTaskComments').mockResolvedValue(comments);

      const result = await taskCommentService.getCommentsWithTruncation('task-123', 'user-123');

      expect(result.comments).toHaveLength(10);
      expect(result.hasMore).toBe(true);
    });

    it('should return all comments when less than limit', async () => {
      const comments = Array.from({ length: 5 }, (_, i) => ({
        ...mockComment,
        id: `comment-${i}`,
        user: mockUser
      }));

      jest.spyOn(taskCommentService, 'getTaskComments').mockResolvedValue(comments);

      const result = await taskCommentService.getCommentsWithTruncation('task-123', 'user-123');

      expect(result.comments).toHaveLength(5);
      expect(result.hasMore).toBe(false);
    });
  });
});