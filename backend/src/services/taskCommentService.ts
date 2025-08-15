import { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { TaskComment, User } from '../../../shared/src/types';
import { dynamoDb, TABLES } from '../config/dynamodb';
import { TaskService } from './taskService';
import { UserService } from './userService';

export interface TaskCommentWithUser extends TaskComment {
  user?: User;
}

export class TaskCommentService {
  private taskService = new TaskService();
  private userService = new UserService();

  private convertDbCommentToComment(dbComment: any): TaskComment {
    return {
      ...dbComment,
      createdAt: new Date(dbComment.createdAt),
      updatedAt: new Date(dbComment.updatedAt)
    };
  }

  async getTaskComments(taskId: string, userId: string, limit: number = 10): Promise<TaskCommentWithUser[]> {
    // Check if user has access to the task
    await this.taskService.getTask(taskId, userId);

    const command = new QueryCommand({
      TableName: TABLES.TASK_COMMENTS,
      IndexName: 'TaskIndex',
      KeyConditionExpression: 'taskId = :taskId',
      ExpressionAttributeValues: {
        ':taskId': taskId
      },
      ScanIndexForward: false, // Sort by createdAt descending (newest first)
      Limit: limit
    });

    const result = await dynamoDb.send(command);
    const comments = (result.Items || []).map(item => this.convertDbCommentToComment(item));
    
    // Fetch user information for each comment
    const commentsWithUsers: TaskCommentWithUser[] = [];
    for (const comment of comments) {
      try {
        const user = await this.userService.getUser(comment.userId);
        commentsWithUsers.push({ ...comment, user: user || undefined });
      } catch (error) {
        // If user not found, include comment without user info
        console.warn(`User not found for comment ${comment.id}:`, error);
        commentsWithUsers.push(comment);
      }
    }
    
    return commentsWithUsers;
  }

  async createComment(taskId: string, content: string, userId: string): Promise<TaskCommentWithUser> {
    // Check if user has access to the task
    await this.taskService.getTask(taskId, userId);

    const now = new Date();
    const comment: TaskComment = {
      id: uuidv4(),
      taskId,
      userId,
      content: content.trim(),
      createdAt: now,
      updatedAt: now
    };

    // Convert Date objects to ISO strings for DynamoDB storage
    const commentForDb = {
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString()
    };

    const command = new PutCommand({
      TableName: TABLES.TASK_COMMENTS,
      Item: commentForDb
    });

    await dynamoDb.send(command);

    // Fetch user information for the comment
    try {
      const user = await this.userService.getUser(userId);
      return { ...comment, user: user || undefined };
    } catch (error) {
      console.warn(`User not found for comment ${comment.id}:`, error);
      return comment;
    }
  }

  async updateComment(commentId: string, content: string, userId: string): Promise<TaskCommentWithUser> {
    // Get existing comment to check ownership and task access
    const existingComment = await this.getComment(commentId, userId);
    
    // Only the comment author can update their comment
    if (existingComment.userId !== userId) {
      throw new Error('You can only update your own comments');
    }

    const command = new UpdateCommand({
      TableName: TABLES.TASK_COMMENTS,
      Key: { id: commentId },
      UpdateExpression: 'SET content = :content, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':content': content.trim(),
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await dynamoDb.send(command);
    const updatedComment = this.convertDbCommentToComment(result.Attributes);

    // Fetch user information for the updated comment
    try {
      const user = await this.userService.getUser(userId);
      return { ...updatedComment, user: user || undefined };
    } catch (error) {
      console.warn(`User not found for comment ${commentId}:`, error);
      return updatedComment;
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    // Get existing comment to check ownership and task access
    const existingComment = await this.getComment(commentId, userId);
    
    // Only the comment author can delete their comment
    if (existingComment.userId !== userId) {
      throw new Error('You can only delete your own comments');
    }

    const command = new DeleteCommand({
      TableName: TABLES.TASK_COMMENTS,
      Key: { id: commentId }
    });

    await dynamoDb.send(command);
  }

  async getComment(commentId: string, userId: string): Promise<TaskComment> {
    const command = new GetCommand({
      TableName: TABLES.TASK_COMMENTS,
      Key: { id: commentId }
    });

    const result = await dynamoDb.send(command);
    
    if (!result.Item) {
      throw new Error('Comment not found');
    }

    const comment = this.convertDbCommentToComment(result.Item);

    // Check if user has access to the task
    await this.taskService.getTask(comment.taskId, userId);

    return comment;
  }

  async getCommentsWithTruncation(taskId: string, userId: string): Promise<{ comments: TaskCommentWithUser[], hasMore: boolean }> {
    const limit = 10;
    const comments = await this.getTaskComments(taskId, userId, limit + 1);
    
    const hasMore = comments.length > limit;
    const displayComments = hasMore ? comments.slice(0, limit) : comments;
    
    return {
      comments: displayComments,
      hasMore
    };
  }
}