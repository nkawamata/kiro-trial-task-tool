import { GetCommand, PutCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { ProjectMember, ProjectRole, User } from '../../../shared/src/types';
import { dynamoDb, TABLES } from '../config/dynamodb';
import { UserService } from './userService';

export class TeamService {
  private userService = new UserService();

  private convertDbMemberToMember(dbMember: any): ProjectMember {
    return {
      ...dbMember,
      joinedAt: new Date(dbMember.joinedAt)
    };
  }

  async addProjectMember(projectId: string, userId: string, role: ProjectRole, addedBy: string): Promise<ProjectMember> {
    // Check if user is already a member
    const existingMember = await this.getProjectMember(projectId, userId);
    if (existingMember) {
      throw new Error('User is already a member of this project');
    }

    // Verify the user exists
    const user = await this.userService.getUserProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const member: ProjectMember = {
      id: uuidv4(),
      projectId,
      userId,
      role,
      joinedAt: now
    };

    const memberForDb = {
      ...member,
      joinedAt: member.joinedAt.toISOString()
    };

    const command = new PutCommand({
      TableName: TABLES.PROJECT_MEMBERS,
      Item: memberForDb
    });

    await dynamoDb.send(command);
    return member;
  }

  async removeProjectMember(projectId: string, userId: string, removedBy: string): Promise<void> {
    const member = await this.getProjectMember(projectId, userId);
    if (!member) {
      throw new Error('User is not a member of this project');
    }

    const command = new DeleteCommand({
      TableName: TABLES.PROJECT_MEMBERS,
      Key: { id: member.id }
    });

    await dynamoDb.send(command);
  }

  async updateMemberRole(projectId: string, userId: string, newRole: ProjectRole, updatedBy: string): Promise<ProjectMember> {
    const member = await this.getProjectMember(projectId, userId);
    if (!member) {
      throw new Error('User is not a member of this project');
    }

    const command = new PutCommand({
      TableName: TABLES.PROJECT_MEMBERS,
      Item: {
        ...member,
        role: newRole,
        joinedAt: member.joinedAt.toISOString()
      }
    });

    await dynamoDb.send(command);
    
    return {
      ...member,
      role: newRole
    };
  }

  async getProjectMembers(projectId: string): Promise<(ProjectMember & { user: User })[]> {
    const command = new QueryCommand({
      TableName: TABLES.PROJECT_MEMBERS,
      IndexName: 'ProjectIdIndex',
      KeyConditionExpression: 'projectId = :projectId',
      ExpressionAttributeValues: {
        ':projectId': projectId
      }
    });

    const result = await dynamoDb.send(command);
    const members = (result.Items || []).map(item => this.convertDbMemberToMember(item));

    // Get user details for each member, filtering out members with missing users
    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        try {
          const user = await this.userService.getUserProfile(member.userId);
          return { ...member, user };
        } catch (error) {
          console.warn(`User not found for member ${member.id} (userId: ${member.userId})`);
          return null;
        }
      })
    );

    // Filter out null entries (members with missing users)
    return membersWithUsers.filter((member): member is ProjectMember & { user: User } => member !== null);
  }

  async getProjectMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    const command = new ScanCommand({
      TableName: TABLES.PROJECT_MEMBERS,
      FilterExpression: 'projectId = :projectId AND userId = :userId',
      ExpressionAttributeValues: {
        ':projectId': projectId,
        ':userId': userId
      }
    });

    const result = await dynamoDb.send(command);
    
    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return this.convertDbMemberToMember(result.Items[0]);
  }

  async getUserProjectRole(projectId: string, userId: string): Promise<ProjectRole | null> {
    const member = await this.getProjectMember(projectId, userId);
    return member ? member.role : null;
  }

  async canUserManageTeam(projectId: string, userId: string): Promise<boolean> {
    // Check if user is project owner
    const projectCommand = new GetCommand({
      TableName: TABLES.PROJECTS,
      Key: { id: projectId }
    });

    const projectResult = await dynamoDb.send(projectCommand);
    if (projectResult.Item && projectResult.Item.ownerId === userId) {
      return true;
    }

    // Check if user has admin role
    const role = await this.getUserProjectRole(projectId, userId);
    return role === ProjectRole.ADMIN;
  }
}