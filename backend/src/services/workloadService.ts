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
    console.log('Fetching team workload summary:', { projectId, startDate, endDate });
    
    let workloadEntries: WorkloadEntry[] = [];
    
    try {
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
      console.log('Team workload query result:', { 
        itemCount: result.Items?.length || 0,
        items: result.Items?.slice(0, 3)
      });
      
      workloadEntries = (result.Items || []) as WorkloadEntry[];
    } catch (error) {
      console.error('Error querying team workload with ProjectIdDateIndex, falling back to scan:', error);
      
      // Fallback to scan if index query fails
      const scanCommand = new ScanCommand({
        TableName: TABLES.WORKLOAD,
        FilterExpression: 'projectId = :projectId AND #date BETWEEN :startDate AND :endDate',
        ExpressionAttributeNames: {
          '#date': 'date'
        },
        ExpressionAttributeValues: {
          ':projectId': projectId,
          ':startDate': startDate,
          ':endDate': endDate
        }
      });

      const scanResult = await dynamoDb.send(scanCommand);
      console.log('Team workload scan result:', { 
        itemCount: scanResult.Items?.length || 0,
        items: scanResult.Items?.slice(0, 3)
      });
      
      workloadEntries = (scanResult.Items || []) as WorkloadEntry[];
    }

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

    const result = Array.from(userMap.entries()).map(([userId, data]) => ({
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
    
    console.log('Team workload summary result:', { 
      projectId, 
      userCount: result.length,
      users: result.map(r => ({ userId: r.userId, userName: r.userName, hours: r.totalAllocatedHours }))
    });
    
    return result;
  }

  async getAllProjectsTeamWorkloadSummary(
    startDate: string,
    endDate: string
  ): Promise<WorkloadSummary[]> {
    // Scan all workload entries for the date range
    const command = new ScanCommand({
      TableName: TABLES.WORKLOAD,
      FilterExpression: '#date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#date': 'date'
      },
      ExpressionAttributeValues: {
        ':startDate': startDate,
        ':endDate': endDate
      }
    });

    const result = await dynamoDb.send(command);
    const workloadEntries = (result.Items || []) as WorkloadEntry[];

    // Group by user and project
    const userProjectMap = new Map<string, Map<string, { allocatedHours: number; actualHours: number; projectName: string }>>();
    const userNamesMap = new Map<string, string>();

    for (const entry of workloadEntries) {
      // Get or create user map
      if (!userProjectMap.has(entry.userId)) {
        userProjectMap.set(entry.userId, new Map());

        // Get user name
        try {
          const user = await this.userService.getUserProfile(entry.userId);
          userNamesMap.set(entry.userId, user.name);
        } catch (error) {
          userNamesMap.set(entry.userId, 'Unknown User');
        }
      }

      const userProjects = userProjectMap.get(entry.userId)!;

      // Get or create project data
      if (!userProjects.has(entry.projectId)) {
        // Get project name
        try {
          const project = await this.projectService.getProject(entry.projectId, entry.userId);
          userProjects.set(entry.projectId, {
            allocatedHours: 0,
            actualHours: 0,
            projectName: project.name
          });
        } catch (error) {
          userProjects.set(entry.projectId, {
            allocatedHours: 0,
            actualHours: 0,
            projectName: 'Unknown Project'
          });
        }
      }

      const projectData = userProjects.get(entry.projectId)!;
      projectData.allocatedHours += entry.allocatedHours;
      projectData.actualHours += entry.actualHours || 0;
    }

    // Convert to WorkloadSummary format
    return Array.from(userProjectMap.entries()).map(([userId, userProjects]) => {
      const projects = Array.from(userProjects.entries()).map(([projectId, data]) => ({
        projectId,
        projectName: data.projectName,
        allocatedHours: data.allocatedHours,
        actualHours: data.actualHours
      }));

      const totalAllocatedHours = projects.reduce((sum, p) => sum + p.allocatedHours, 0);
      const totalActualHours = projects.reduce((sum, p) => sum + p.actualHours, 0);

      return {
        userId,
        userName: userNamesMap.get(userId) || 'Unknown User',
        totalAllocatedHours,
        totalActualHours,
        projects
      };
    });
  }

  async getAllProjectsDailyWorkload(
    startDate: string,
    endDate: string
  ): Promise<{ [userId: string]: { [date: string]: number } }> {
    console.log('Fetching all projects daily workload:', { startDate, endDate });

    // Scan all workload entries for the date range
    const command = new ScanCommand({
      TableName: TABLES.WORKLOAD,
      FilterExpression: '#date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#date': 'date'
      },
      ExpressionAttributeValues: {
        ':startDate': startDate,
        ':endDate': endDate
      }
    });

    console.log('Executing scan for all projects daily workload...');
    const result = await dynamoDb.send(command);
    console.log('Scan result:', { 
      itemCount: result.Items?.length || 0,
      items: result.Items?.slice(0, 3), // Log first 3 items for debugging
      projectIds: [...new Set(result.Items?.map(item => item.projectId))] // Show unique project IDs
    });

    const workloadEntries = (result.Items || []) as WorkloadEntry[];
    const processedData = this.processWorkloadEntries(workloadEntries);
    console.log('Processed all projects daily workload:', processedData);
    return processedData;
  }

  async allocateWorkload(allocationData: Partial<WorkloadEntry>): Promise<WorkloadEntry> {
    // Ensure date is properly parsed if it's a string
    let date: Date;
    if (allocationData.date) {
      date = typeof allocationData.date === 'string' ? parseISO(allocationData.date) : allocationData.date;
    } else {
      date = new Date();
    }

    const dateString = format(date, 'yyyy-MM-dd');

    console.log('Allocating workload:', {
      userId: allocationData.userId,
      projectId: allocationData.projectId,
      taskId: allocationData.taskId,
      date: dateString,
      allocatedHours: allocationData.allocatedHours
    });

    const workloadEntry: WorkloadEntry = {
      id: uuidv4(),
      userId: allocationData.userId!,
      projectId: allocationData.projectId!,
      taskId: allocationData.taskId!,
      date: dateString, // Store as string consistently
      allocatedHours: allocationData.allocatedHours || 8,
      actualHours: allocationData.actualHours
    };

    const command = new PutCommand({
      TableName: TABLES.WORKLOAD,
      Item: workloadEntry
    });

    await dynamoDb.send(command);
    console.log('Workload allocated successfully:', workloadEntry);
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
    console.log('Fetching workload entries for:', { userId, startDate, endDate });

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
    const entries = (result.Items || []).map(item => ({
      id: item.id,
      userId: item.userId,
      projectId: item.projectId,
      taskId: item.taskId,
      date: item.date, // Keep as string for consistency
      allocatedHours: item.allocatedHours,
      actualHours: item.actualHours
    })) as WorkloadEntry[];

    console.log('Found workload entries:', entries);
    return entries;
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

  async updateWorkloadEntry(
    workloadId: string,
    updateData: Partial<WorkloadEntry>
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

    // Process the date if provided
    let processedDate = originalEntry.date;
    if (updateData.date) {
      const date = typeof updateData.date === 'string' ? parseISO(updateData.date) : updateData.date;
      processedDate = format(date, 'yyyy-MM-dd');
    }

    const updatedEntry = {
      ...originalEntry,
      ...updateData,
      date: processedDate,
      updatedAt: new Date().toISOString()
    };

    const putCommand = new PutCommand({
      TableName: TABLES.WORKLOAD,
      Item: updatedEntry
    });

    await dynamoDb.send(putCommand);

    console.log('Workload entry updated successfully:', updatedEntry);

    // Return the updated entry
    return {
      id: updatedEntry.id,
      userId: updatedEntry.userId,
      projectId: updatedEntry.projectId,
      taskId: updatedEntry.taskId,
      date: updatedEntry.date,
      allocatedHours: updatedEntry.allocatedHours,
      actualHours: updatedEntry.actualHours
    } as WorkloadEntry;
  }

  async deleteWorkloadEntry(workloadId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLES.WORKLOAD,
      Key: { id: workloadId }
    });

    await dynamoDb.send(command);
  }

  async getTaskWorkloadEntries(
    taskId: string,
    startDate: string,
    endDate: string
  ): Promise<WorkloadEntry[]> {
    // Since we don't have a taskId index, we'll need to scan the table
    // In a production system, you'd want to add a GSI for taskId
    const command = new ScanCommand({
      TableName: TABLES.WORKLOAD,
      FilterExpression: 'taskId = :taskId AND #date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#date': 'date'
      },
      ExpressionAttributeValues: {
        ':taskId': taskId,
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

  async getTeamDailyWorkload(
    projectId: string,
    startDate: string,
    endDate: string
  ): Promise<{ [userId: string]: { [date: string]: number } }> {
    console.log('Fetching team daily workload:', { projectId, startDate, endDate });

    try {
      // Try using the ProjectIdDateIndex first
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

      console.log('Executing query with ProjectIdDateIndex...');
      const result = await dynamoDb.send(command);
      console.log('Query result:', { 
        itemCount: result.Items?.length || 0,
        items: result.Items?.slice(0, 3) // Log first 3 items for debugging
      });

      const workloadEntries = (result.Items || []) as WorkloadEntry[];
      const processedData = this.processWorkloadEntries(workloadEntries);
      console.log('Processed team daily workload:', processedData);
      return processedData;

    } catch (error) {
      console.error('Error querying with ProjectIdDateIndex, falling back to scan:', error);

      // Fallback to scan if index query fails
      const scanCommand = new ScanCommand({
        TableName: TABLES.WORKLOAD,
        FilterExpression: 'projectId = :projectId AND #date BETWEEN :startDate AND :endDate',
        ExpressionAttributeNames: {
          '#date': 'date'
        },
        ExpressionAttributeValues: {
          ':projectId': projectId,
          ':startDate': startDate,
          ':endDate': endDate
        }
      });

      console.log('Executing fallback scan...');
      const scanResult = await dynamoDb.send(scanCommand);
      console.log('Scan result:', { 
        itemCount: scanResult.Items?.length || 0,
        items: scanResult.Items?.slice(0, 3) // Log first 3 items for debugging
      });

      const workloadEntries = (scanResult.Items || []) as WorkloadEntry[];
      const processedData = this.processWorkloadEntries(workloadEntries);
      console.log('Processed team daily workload (from scan):', processedData);
      return processedData;
    }
  }

  private processWorkloadEntries(workloadEntries: WorkloadEntry[]): { [userId: string]: { [date: string]: number } } {
    console.log('Processing workload entries:', workloadEntries);

    // Group by user and date
    const dailyWorkload: { [userId: string]: { [date: string]: number } } = {};

    for (const entry of workloadEntries) {
      if (!dailyWorkload[entry.userId]) {
        dailyWorkload[entry.userId] = {};
      }

      const dateString = typeof entry.date === 'string' ? entry.date : format(entry.date, 'yyyy-MM-dd');

      if (!dailyWorkload[entry.userId][dateString]) {
        dailyWorkload[entry.userId][dateString] = 0;
      }

      dailyWorkload[entry.userId][dateString] += entry.allocatedHours;
    }

    console.log('Processed daily workload:', dailyWorkload);
    return dailyWorkload;
  }
}