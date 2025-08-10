import { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskPriority } from '../../../shared/src/types';
import { dynamoDb, TABLES } from '../config/dynamodb';
import { ProjectService } from './projectService';

export class TaskService {
  private projectService = new ProjectService();

  private convertDbTaskToTask(dbTask: any): Task {
    return {
      ...dbTask,
      startDate: dbTask.startDate ? new Date(dbTask.startDate) : undefined,
      endDate: dbTask.endDate ? new Date(dbTask.endDate) : undefined,
      createdAt: new Date(dbTask.createdAt),
      updatedAt: new Date(dbTask.updatedAt)
    };
  }

  async getProjectTasks(projectId: string, userId: string): Promise<Task[]> {
    // Check if user has access to the project
    await this.projectService.getProject(projectId, userId);

    const command = new QueryCommand({
      TableName: TABLES.TASKS,
      IndexName: 'ProjectIdIndex',
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: {
        ':projectId': projectId
      }
    });

    const result = await dynamoDb.send(command);
    return (result.Items || []).map(item => this.convertDbTaskToTask(item));
  }

  async createTask(taskData: Partial<Task>, userId: string): Promise<Task> {
    // Check if user has access to the project
    await this.projectService.getProject(taskData.projectId!, userId);

    const now = new Date();
    const task: Task = {
      id: uuidv4(),
      title: taskData.title!,
      description: taskData.description,
      projectId: taskData.projectId!,
      assigneeId: taskData.assigneeId,
      status: taskData.status || TaskStatus.TODO,
      priority: taskData.priority || TaskPriority.MEDIUM,
      startDate: taskData.startDate,
      endDate: taskData.endDate,
      estimatedHours: taskData.estimatedHours,
      actualHours: taskData.actualHours,
      dependencies: taskData.dependencies || [],
      createdAt: now,
      updatedAt: now
    };

    // Convert Date objects to ISO strings for DynamoDB storage
    const taskForDb = {
      ...task,
      startDate: task.startDate ? task.startDate.toISOString() : undefined,
      endDate: task.endDate ? task.endDate.toISOString() : undefined,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    };

    const command = new PutCommand({
      TableName: TABLES.TASKS,
      Item: taskForDb
    });

    await dynamoDb.send(command);
    return task;
  }

  async getTask(taskId: string, userId: string): Promise<Task> {
    const command = new GetCommand({
      TableName: TABLES.TASKS,
      Key: { id: taskId }
    });

    const result = await dynamoDb.send(command);
    
    if (!result.Item) {
      throw new Error('Task not found');
    }

    const task = this.convertDbTaskToTask(result.Item);

    // Check if user has access to the project
    await this.projectService.getProject(task.projectId, userId);

    return task;
  }

  async updateTask(taskId: string, updates: Partial<Task>, userId: string): Promise<Task> {
    // Get existing task to check project access
    const existingTask = await this.getTask(taskId, userId);

    const updateExpression = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updates.title) {
      updateExpression.push('title = :title');
      expressionAttributeValues[':title'] = updates.title;
    }

    if (updates.description !== undefined) {
      updateExpression.push('description = :description');
      expressionAttributeValues[':description'] = updates.description;
    }

    if (updates.assigneeId !== undefined) {
      updateExpression.push('assigneeId = :assigneeId');
      expressionAttributeValues[':assigneeId'] = updates.assigneeId;
    }

    if (updates.status) {
      updateExpression.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = updates.status;
    }

    if (updates.priority) {
      updateExpression.push('priority = :priority');
      expressionAttributeValues[':priority'] = updates.priority;
    }

    if (updates.startDate !== undefined) {
      updateExpression.push('startDate = :startDate');
      expressionAttributeValues[':startDate'] = updates.startDate instanceof Date ? updates.startDate.toISOString() : updates.startDate;
    }

    if (updates.endDate !== undefined) {
      updateExpression.push('endDate = :endDate');
      expressionAttributeValues[':endDate'] = updates.endDate instanceof Date ? updates.endDate.toISOString() : updates.endDate;
    }

    if (updates.estimatedHours !== undefined) {
      updateExpression.push('estimatedHours = :estimatedHours');
      expressionAttributeValues[':estimatedHours'] = updates.estimatedHours;
    }

    if (updates.actualHours !== undefined) {
      updateExpression.push('actualHours = :actualHours');
      expressionAttributeValues[':actualHours'] = updates.actualHours;
    }

    if (updates.dependencies) {
      updateExpression.push('dependencies = :dependencies');
      expressionAttributeValues[':dependencies'] = updates.dependencies;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: TABLES.TASKS,
      Key: { id: taskId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await dynamoDb.send(command);
    return this.convertDbTaskToTask(result.Attributes);
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    // Check access by getting the task
    await this.getTask(taskId, userId);

    const command = new DeleteCommand({
      TableName: TABLES.TASKS,
      Key: { id: taskId }
    });

    await dynamoDb.send(command);
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    const command = new QueryCommand({
      TableName: TABLES.TASKS,
      IndexName: 'AssigneeIdIndex',
      KeyConditionExpression: 'assigneeId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    const result = await dynamoDb.send(command);
    return (result.Items || []).map(item => this.convertDbTaskToTask(item));
  }
}