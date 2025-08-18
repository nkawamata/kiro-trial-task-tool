import { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Project, ProjectStatus, ProjectMember, ProjectRole } from '../../../shared/src/types';
import { dynamoDb, TABLES } from '../config/dynamodb';
import { TeamService } from './teamService';
import { TeamsService } from './teamsService';

export class ProjectService {
  private teamService = new TeamService();
  private teamsService = new TeamsService();

  private convertDbProjectToProject(dbProject: any): Project {
    return {
      ...dbProject,
      startDate: new Date(dbProject.startDate),
      endDate: dbProject.endDate ? new Date(dbProject.endDate) : undefined,
      createdAt: new Date(dbProject.createdAt),
      updatedAt: new Date(dbProject.updatedAt)
    };
  }
  async getUserProjects(userId: string): Promise<Project[]> {
    // Get projects owned by user
    const ownedProjectsCommand = new QueryCommand({
      TableName: TABLES.PROJECTS,
      IndexName: 'OwnerIdIndex',
      KeyConditionExpression: 'ownerId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    const ownedResult = await dynamoDb.send(ownedProjectsCommand);
    const ownedProjects = (ownedResult.Items || []).map(item => this.convertDbProjectToProject(item));

    // Get projects where user is a member
    const membershipCommand = new QueryCommand({
      TableName: TABLES.PROJECT_MEMBERS,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    const membershipResult = await dynamoDb.send(membershipCommand);
    const memberships = (membershipResult.Items || []) as ProjectMember[];

    // Get member projects
    const memberProjects: Project[] = [];
    for (const membership of memberships) {
      const projectCommand = new GetCommand({
        TableName: TABLES.PROJECTS,
        Key: { id: membership.projectId }
      });
      
      const projectResult = await dynamoDb.send(projectCommand);
      if (projectResult.Item) {
        memberProjects.push(this.convertDbProjectToProject(projectResult.Item));
      }
    }

    // Combine and deduplicate
    const allProjects = [...ownedProjects, ...memberProjects];
    const uniqueProjects = allProjects.filter((project, index, self) => 
      index === self.findIndex(p => p.id === project.id)
    );

    return uniqueProjects;
  }

  async createProject(projectData: Partial<Project>): Promise<Project> {
    const now = new Date();
    
    // Ensure dates are Date objects
    const startDate = projectData.startDate 
      ? (projectData.startDate instanceof Date ? projectData.startDate : new Date(projectData.startDate))
      : now;
    const endDate = projectData.endDate 
      ? (projectData.endDate instanceof Date ? projectData.endDate : new Date(projectData.endDate))
      : undefined;
    
    const project: Project = {
      id: uuidv4(),
      name: projectData.name!,
      description: projectData.description,
      ownerId: projectData.ownerId!,
      startDate,
      endDate,
      status: projectData.status || ProjectStatus.PLANNING,
      createdAt: now,
      updatedAt: now
    };

    // Convert Date objects to ISO strings for DynamoDB storage
    const projectForDb = {
      ...project,
      startDate: project.startDate.toISOString(),
      endDate: project.endDate ? project.endDate.toISOString() : undefined,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    };

    const command = new PutCommand({
      TableName: TABLES.PROJECTS,
      Item: projectForDb
    });

    await dynamoDb.send(command);

    // Automatically add the project owner as a team member with OWNER role
    try {
      await this.teamService.addProjectMember(project.id, project.ownerId, ProjectRole.OWNER, project.ownerId);
    } catch (error) {
      console.error('Failed to add project owner as team member:', error);
      // Don't fail project creation if team member addition fails
    }

    return project;
  }

  async createProjectWithTeam(
    projectData: Partial<Project>, 
    teamMembers: Array<{ userId: string; role: ProjectRole }> = []
  ): Promise<Project> {
    // Create the project first
    const project = await this.createProject(projectData);

    // Add additional team members
    for (const member of teamMembers) {
      try {
        await this.teamService.addProjectMember(project.id, member.userId, member.role, project.ownerId);
      } catch (error) {
        console.error(`Failed to add team member ${member.userId}:`, error);
        // Continue adding other members even if one fails
      }
    }

    return project;
  }

  async getProject(projectId: string, userId: string): Promise<Project> {
    const command = new GetCommand({
      TableName: TABLES.PROJECTS,
      Key: { id: projectId }
    });

    const result = await dynamoDb.send(command);
    
    if (!result.Item) {
      throw new Error('Project not found');
    }

    const project = this.convertDbProjectToProject(result.Item);

    // Check if user has access to this project
    const hasAccess = await this.userHasProjectAccess(userId, projectId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    return project;
  }

  async updateProject(projectId: string, updates: Partial<Project>, userId: string): Promise<Project> {
    // Check access
    const hasAccess = await this.userHasProjectAccess(userId, projectId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const updateExpression = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updates.name) {
      updateExpression.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = updates.name;
    }

    if (updates.description !== undefined) {
      updateExpression.push('description = :description');
      expressionAttributeValues[':description'] = updates.description;
    }

    if (updates.startDate) {
      updateExpression.push('startDate = :startDate');
      expressionAttributeValues[':startDate'] = updates.startDate instanceof Date ? updates.startDate.toISOString() : updates.startDate;
    }

    if (updates.endDate !== undefined) {
      updateExpression.push('endDate = :endDate');
      expressionAttributeValues[':endDate'] = updates.endDate instanceof Date ? updates.endDate.toISOString() : updates.endDate;
    }

    if (updates.status) {
      updateExpression.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = updates.status;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: TABLES.PROJECTS,
      Key: { id: projectId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await dynamoDb.send(command);
    return this.convertDbProjectToProject(result.Attributes);
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    // Check if user is the owner
    const project = await this.getProject(projectId, userId);
    if (project.ownerId !== userId) {
      throw new Error('Only project owner can delete the project');
    }

    const command = new DeleteCommand({
      TableName: TABLES.PROJECTS,
      Key: { id: projectId }
    });

    await dynamoDb.send(command);
  }

  private async userHasProjectAccess(userId: string, projectId: string): Promise<boolean> {
    // Check if user is owner
    const projectCommand = new GetCommand({
      TableName: TABLES.PROJECTS,
      Key: { id: projectId }
    });

    const projectResult = await dynamoDb.send(projectCommand);
    if (projectResult.Item && projectResult.Item.ownerId === userId) {
      return true;
    }

    // Check if user is a direct member
    const membershipCommand = new ScanCommand({
      TableName: TABLES.PROJECT_MEMBERS,
      FilterExpression: 'projectId = :projectId AND userId = :userId',
      ExpressionAttributeValues: {
        ':projectId': projectId,
        ':userId': userId
      }
    });

    const membershipResult = await dynamoDb.send(membershipCommand);
    if ((membershipResult.Items?.length || 0) > 0) {
      return true;
    }

    // Check if user has access through team membership
    const projectTeams = await this.teamsService.getProjectTeams(projectId);
    for (const projectTeam of projectTeams) {
      const teamMember = await this.teamsService.getTeamMember(projectTeam.teamId, userId);
      if (teamMember) {
        return true;
      }
    }

    return false;
  }

  async getUserProjectsIncludingTeams(userId: string): Promise<Project[]> {
    // Get direct projects (owned + member)
    const directProjects = await this.getUserProjects(userId);
    
    // Get projects through team membership
    const userTeams = await this.teamsService.getUserTeams(userId);
    const teamProjects: Project[] = [];
    
    for (const userTeam of userTeams) {
      const teamProjectAssociations = await this.teamsService.getTeamProjects(userTeam.id);
      for (const association of teamProjectAssociations) {
        const projectCommand = new GetCommand({
          TableName: TABLES.PROJECTS,
          Key: { id: association.projectId }
        });
        
        const projectResult = await dynamoDb.send(projectCommand);
        if (projectResult.Item) {
          teamProjects.push(this.convertDbProjectToProject(projectResult.Item));
        }
      }
    }

    // Combine and deduplicate
    const allProjects = [...directProjects, ...teamProjects];
    const uniqueProjects = allProjects.filter((project, index, self) => 
      index === self.findIndex(p => p.id === project.id)
    );

    return uniqueProjects;
  }
}