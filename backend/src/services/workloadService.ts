import { GetCommand, PutCommand, QueryCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { WorkloadSummary, WorkloadEntry } from '../../../shared/src/types';
import { dynamoDb, TABLES } from '../config/dynamodb';
import { UserService } from './userService';
import { ProjectService } from './projectService';

export class WorkloadService {
  private userService = new UserService();
  private projectService = new ProjectService();

  async getUserWorkloadSummary(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<WorkloadSummary> {
    let user;
    try {
      user = await this.userService.getUserProfile(userId);
    } catch (error) {
      // If user not found, return empty workload summary
      return {
        userId,
        userName: 'Unknown User',
        totalAllocatedHours: 0,
        totalActualHours: 0,
        projects: []
      };
    }
    
    const command = new QueryCommand({
      TableName: TABLES.WORKLOAD,
      IndexName: 'UserIdDateIndex',
      KeyConditionExpression: 'userId = :userId AND #date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#date': 'date'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':startDate': startDate,
        ':endDate': endDate
      }
    });

    const result = await dynamoDb.send(command);
    const workloadEntries = (result.Items || []) as WorkloadEntry[];

    // Aggregate by project
    const projectMap = new Map<string, { allocatedHours: number; actualHours: number; projectName: string }>();
    let totalAllocatedHours = 0;
    let totalActualHours = 0;

    for (const entry of workloadEntries) {
      totalAllocatedHours += entry.allocatedHours;
      totalActualHours += entry.actualHours || 0;

      if (!projectMap.has(entry.projectId)) {
        // Get project name
        try {
          const project = await this.projectService.getProject(entry.projectId, userId);
          projectMap.set(entry.projectId, {
            allocatedHours: 0,
            actualHours: 0,
            projectName: project.name
          });
        } catch (error) {
          // Project might be deleted or access denied
          projectMap.set(entry.projectId, {
            allocatedHours: 0,
            actualHours: 0,
            projectName: 'Unknown Project'
          });
        }
      }

      const projectData = projectMap.get(entry.projectId)!;
      projectData.allocatedHours += entry.allocatedHours;
      projectData.actualHours += entry.actualHours || 0;
    }

    const projects = Array.from(projectMap.entries()).map(([projectId, data]) => ({
      projectId,
      projectName: data.projectName,
      allocatedHours: data.allocatedHours,
      actualHours: data.actualHours
    }));

    return {
      userId,
      userName: user.name,
      totalAllocatedHours,
      totalActualHours,
      projects
    };
  }

  async getTeamWorkload(
    projectId: string,
    startDate: string,
    endDate: string
  ): Promise<WorkloadSummary[]> {
    const command = new QueryCommand({
      TableName: TABLES.WORKLOAD,
      IndexName: 'ProjectIdDateIndex',
      KeyConditionExpression: 'projectId = :projectId AND #date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#date': 'date'
      },
      ExpressionAttributeValues: {
        ':projectId': projectId,
        ':startDate': startDate,
        ':endDate': endDate
      }
    });

    const result = await dynamoDb.send(command);
    const workloadEntries = (result.Items || []) as WorkloadEntry[];

    // Group by user
    const userMap = new Map<string, { allocatedHours: number; actualHours: number; userName: string }>();

    for (const entry of workloadEntries) {
      if (!userMap.has(entry.userId)) {
        try {
          const user = await this.userService.getUserProfile(entry.userId);
          userMap.set(entry.userId, {
            allocatedHours: 0,
            actualHours: 0,
            userName: user.name
          });
        } catch (error) {
          userMap.set(entry.userId, {
            allocatedHours: 0,
            actualHours: 0,
            userName: 'Unknown User'
          });
        }
      }

      const userData = userMap.get(entry.userId)!;
      userData.allocatedHours += entry.allocatedHours;
      userData.actualHours += entry.actualHours || 0;
    }

    // Get project name
    let projectName = 'Unknown Project';
    try {
      const project = await this.projectService.getProject(projectId, Array.from(userMap.keys())[0] || 'system');
      projectName = project.name;
    } catch (error) {
      // Handle error silently
    }

    return Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      totalAllocatedHours: data.allocatedHours,
      totalActualHours: data.actualHours,
      projects: [
        {
          projectId,
          projectName,
          allocatedHours: data.allocatedHours,
          actualHours: data.actualHours
        }
      ]
    }));
  }

  async allocateWorkload(allocationData: Partial<WorkloadEntry>): Promise<WorkloadEntry> {
    const workloadEntry: WorkloadEntry = {
      id: uuidv4(),
      userId: allocationData.userId!,
      projectId: allocationData.projectId!,
      taskId: allocationData.taskId!,
      date: allocationData.date || new Date(),
      allocatedHours: allocationData.allocatedHours || 8,
      actualHours: allocationData.actualHours
    };

    const command = new PutCommand({
      TableName: TABLES.WORKLOAD,
      Item: {
        ...workloadEntry,
        date: format(workloadEntry.date, 'yyyy-MM-dd') // Store date as string for querying
      }
    });

    await dynamoDb.send(command);
    return workloadEntry;
  }

  async getWorkloadDistribution(userId: string): Promise<any> {
    // Get all workload entries for the user (last 30 days)
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

    const summary = await this.getUserWorkloadSummary(userId, startDate, endDate);
    
    const totalCapacity = 40; // 40 hours per week
    const allocated = summary.totalAllocatedHours;
    const available = Math.max(0, totalCapacity - allocated);

    const projects = summary.projects.map(project => ({
      projectId: project.projectId,
      name: project.projectName,
      percentage: totalCapacity > 0 ? (project.allocatedHours / totalCapacity) * 100 : 0,
      hours: project.allocatedHours
    }));

    return {
      userId,
      totalCapacity,
      allocated,
      available,
      projects
    };
  }

  async getWorkloadEntries(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<WorkloadEntry[]> {
    const command = new QueryCommand({
      TableName: TABLES.WORKLOAD,
      IndexName: 'UserIdDateIndex',
      KeyConditionExpression: 'userId = :userId AND #date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#date': 'date'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':startDate': startDate,
        ':endDate': endDate
      }
    });

    const result = await dynamoDb.send(command);
    return (result.Items || []).map(item => ({
      id: item.id,
      userId: item.userId,
      projectId: item.projectId,
      taskId: item.taskId,
      date: parseISO(item.date),
      allocatedHours: item.allocatedHours,
      actualHours: item.actualHours
    })) as WorkloadEntry[];
  }

  async updateWorkloadActualHours(
    workloadId: string,
    actualHours: number
  ): Promise<WorkloadEntry> {
    const getCommand = new GetCommand({
      TableName: TABLES.WORKLOAD,
      Key: { id: workloadId }
    });

    const result = await dynamoDb.send(getCommand);
    if (!result.Item) {
      throw new Error('Workload entry not found');
    }

    const originalEntry = result.Item as any;
    const updatedEntry = {
      ...originalEntry,
      actualHours,
      updatedAt: new Date().toISOString()
    };

    const putCommand = new PutCommand({
      TableName: TABLES.WORKLOAD,
      Item: updatedEntry
    });

    await dynamoDb.send(putCommand);

    // Return the updated entry with parsed date
    return {
      id: originalEntry.id,
      userId: originalEntry.userId,
      projectId: originalEntry.projectId,
      taskId: originalEntry.taskId,
      date: parseISO(originalEntry.date),
      allocatedHours: originalEntry.allocatedHours,
      actualHours: actualHours
    } as WorkloadEntry;
  }

  async deleteWorkloadEntry(workloadId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLES.WORKLOAD,
      Key: { id: workloadId }
    });

    await dynamoDb.send(command);
  }
}