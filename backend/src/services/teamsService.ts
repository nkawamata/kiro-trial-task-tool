import { GetCommand, PutCommand, DeleteCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Team, TeamMember, ProjectTeam, TeamRole, User } from '../../../shared/src/types';

// Define TeamRole constants to avoid enum issues
const TEAM_ROLES = {
    OWNER: 'owner' as TeamRole,
    ADMIN: 'admin' as TeamRole,
    MEMBER: 'member' as TeamRole
} as const;
import { dynamoDb, TABLES } from '../config/dynamodb';
import { UserService } from './userService';

export class TeamsService {
    private userService = new UserService();

    private convertDbTeamToTeam(dbTeam: any): Team {
        return {
            ...dbTeam,
            createdAt: new Date(dbTeam.createdAt),
            updatedAt: new Date(dbTeam.updatedAt)
        };
    }

    private convertDbTeamMemberToTeamMember(dbMember: any): TeamMember {
        return {
            ...dbMember,
            joinedAt: new Date(dbMember.joinedAt)
        };
    }

    private convertDbProjectTeamToProjectTeam(dbProjectTeam: any): ProjectTeam {
        return {
            ...dbProjectTeam,
            addedAt: new Date(dbProjectTeam.addedAt)
        };
    }

    // Team CRUD operations
    async createTeam(name: string, description: string | undefined, ownerId: string): Promise<Team> {
        const now = new Date();
        const team: Team = {
            id: uuidv4(),
            name,
            description,
            ownerId,
            createdAt: now,
            updatedAt: now
        };

        const teamForDb = {
            ...team,
            createdAt: team.createdAt.toISOString(),
            updatedAt: team.updatedAt.toISOString()
        };

        const command = new PutCommand({
            TableName: TABLES.TEAMS,
            Item: teamForDb
        });

        await dynamoDb.send(command);

        // Add owner as team admin
        await this.addTeamMember(team.id, ownerId, TEAM_ROLES.OWNER, ownerId);

        return team;
    }

    async getTeam(teamId: string): Promise<Team | null> {
        const command = new GetCommand({
            TableName: TABLES.TEAMS,
            Key: { id: teamId }
        });

        const result = await dynamoDb.send(command);

        if (!result.Item) {
            return null;
        }

        return this.convertDbTeamToTeam(result.Item);
    }

    async updateTeam(teamId: string, updates: Partial<Pick<Team, 'name' | 'description'>>, updatedBy: string): Promise<Team> {
        const team = await this.getTeam(teamId);
        if (!team) {
            throw new Error('Team not found');
        }

        // Check permissions
        const canManage = await this.canUserManageTeam(teamId, updatedBy);
        if (!canManage) {
            throw new Error('Insufficient permissions to update team');
        }

        const now = new Date();
        const updatedTeam = {
            ...team,
            ...updates,
            updatedAt: now
        };

        const command = new UpdateCommand({
            TableName: TABLES.TEAMS,
            Key: { id: teamId },
            UpdateExpression: 'SET #name = :name, description = :description, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#name': 'name'
            },
            ExpressionAttributeValues: {
                ':name': updatedTeam.name,
                ':description': updatedTeam.description,
                ':updatedAt': updatedTeam.updatedAt.toISOString()
            },
            ReturnValues: 'ALL_NEW'
        });

        await dynamoDb.send(command);
        return updatedTeam;
    }

    async deleteTeam(teamId: string, deletedBy: string): Promise<void> {
        const team = await this.getTeam(teamId);
        if (!team) {
            throw new Error('Team not found');
        }

        // Check permissions - only owner can delete team
        if (team.ownerId !== deletedBy) {
            throw new Error('Only team owner can delete the team');
        }

        // Remove all team members
        const members = await this.getTeamMembers(teamId);
        for (const member of members) {
            await this.removeTeamMember(teamId, member.userId, deletedBy);
        }

        // Remove team from all projects
        const projectTeams = await this.getTeamProjects(teamId);
        for (const projectTeam of projectTeams) {
            await this.removeTeamFromProject(projectTeam.projectId, teamId, deletedBy);
        }

        // Delete the team
        const command = new DeleteCommand({
            TableName: TABLES.TEAMS,
            Key: { id: teamId }
        });

        await dynamoDb.send(command);
    }

    async getUserTeams(userId: string): Promise<(Team & { role: TeamRole })[]> {
        // Get all team memberships for user
        const command = new QueryCommand({
            TableName: TABLES.TEAM_MEMBERS,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        });

        const result = await dynamoDb.send(command);
        const memberships = (result.Items || []).map(item => this.convertDbTeamMemberToTeamMember(item));

        // Get team details for each membership
        const teamsWithRoles = await Promise.all(
            memberships.map(async (membership) => {
                const team = await this.getTeam(membership.teamId);
                if (!team) return null;
                return { ...team, role: membership.role };
            })
        );

        return teamsWithRoles.filter((team): team is Team & { role: TeamRole } => team !== null);
    }

    // Team member management
    async addTeamMember(teamId: string, userId: string, role: TeamRole, addedBy: string): Promise<TeamMember> {
        // Check if user is already a member
        const existingMember = await this.getTeamMember(teamId, userId);
        if (existingMember) {
            throw new Error('User is already a member of this team');
        }

        // Verify the user exists
        const user = await this.userService.getUserProfile(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check permissions (unless adding owner during team creation)
        if (addedBy !== userId || role !== TEAM_ROLES.OWNER) {
            const canManage = await this.canUserManageTeam(teamId, addedBy);
            if (!canManage) {
                throw new Error('Insufficient permissions to add team members');
            }
        }

        const now = new Date();
        const member: TeamMember = {
            id: uuidv4(),
            teamId,
            userId,
            role,
            joinedAt: now
        };

        const memberForDb = {
            ...member,
            joinedAt: member.joinedAt.toISOString()
        };

        const command = new PutCommand({
            TableName: TABLES.TEAM_MEMBERS,
            Item: memberForDb
        });

        await dynamoDb.send(command);
        return member;
    }

    async removeTeamMember(teamId: string, userId: string, removedBy: string): Promise<void> {
        const member = await this.getTeamMember(teamId, userId);
        if (!member) {
            throw new Error('User is not a member of this team');
        }

        // Check permissions
        const canManage = await this.canUserManageTeam(teamId, removedBy);
        const isRemovingSelf = removedBy === userId;

        if (!canManage && !isRemovingSelf) {
            throw new Error('Insufficient permissions to remove team members');
        }

        // Prevent removing the last owner
        if (member.role === TEAM_ROLES.OWNER) {
            const owners = await this.getTeamMembersByRole(teamId, TEAM_ROLES.OWNER);
            if (owners.length === 1) {
                throw new Error('Cannot remove the last owner of the team');
            }
        }

        const command = new DeleteCommand({
            TableName: TABLES.TEAM_MEMBERS,
            Key: { id: member.id }
        });

        await dynamoDb.send(command);
    }

    async updateTeamMemberRole(teamId: string, userId: string, newRole: TeamRole, updatedBy: string): Promise<TeamMember> {
        const member = await this.getTeamMember(teamId, userId);
        if (!member) {
            throw new Error('User is not a member of this team');
        }

        // Check permissions
        const canManage = await this.canUserManageTeam(teamId, updatedBy);
        if (!canManage) {
            throw new Error('Insufficient permissions to update team member roles');
        }

        // Prevent removing the last owner
        if (member.role === TEAM_ROLES.OWNER && newRole !== TEAM_ROLES.OWNER) {
            const owners = await this.getTeamMembersByRole(teamId, TEAM_ROLES.OWNER);
            if (owners.length === 1) {
                throw new Error('Cannot remove the last owner of the team');
            }
        }

        const command = new UpdateCommand({
            TableName: TABLES.TEAM_MEMBERS,
            Key: { id: member.id },
            UpdateExpression: 'SET #role = :role',
            ExpressionAttributeNames: {
                '#role': 'role'
            },
            ExpressionAttributeValues: {
                ':role': newRole
            },
            ReturnValues: 'ALL_NEW'
        });

        await dynamoDb.send(command);

        return {
            ...member,
            role: newRole
        };
    }

    async getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]> {
        const command = new QueryCommand({
            TableName: TABLES.TEAM_MEMBERS,
            IndexName: 'TeamIdIndex',
            KeyConditionExpression: 'teamId = :teamId',
            ExpressionAttributeValues: {
                ':teamId': teamId
            }
        });

        const result = await dynamoDb.send(command);
        const members = (result.Items || []).map(item => this.convertDbTeamMemberToTeamMember(item));

        // Get user details for each member
        const membersWithUsers = await Promise.all(
            members.map(async (member) => {
                try {
                    const user = await this.userService.getUserProfile(member.userId);
                    return { ...member, user };
                } catch (error) {
                    console.warn(`User not found for team member ${member.id} (userId: ${member.userId})`);
                    return null;
                }
            })
        );

        return membersWithUsers.filter((member): member is TeamMember & { user: User } => member !== null);
    }

    async getTeamMember(teamId: string, userId: string): Promise<TeamMember | null> {
        const command = new ScanCommand({
            TableName: TABLES.TEAM_MEMBERS,
            FilterExpression: 'teamId = :teamId AND userId = :userId',
            ExpressionAttributeValues: {
                ':teamId': teamId,
                ':userId': userId
            }
        });

        const result = await dynamoDb.send(command);

        if (!result.Items || result.Items.length === 0) {
            return null;
        }

        return this.convertDbTeamMemberToTeamMember(result.Items[0]);
    }

    async getTeamMembersByRole(teamId: string, role: TeamRole): Promise<TeamMember[]> {
        const command = new ScanCommand({
            TableName: TABLES.TEAM_MEMBERS,
            FilterExpression: 'teamId = :teamId AND #role = :role',
            ExpressionAttributeNames: {
                '#role': 'role'
            },
            ExpressionAttributeValues: {
                ':teamId': teamId,
                ':role': role
            }
        });

        const result = await dynamoDb.send(command);
        return (result.Items || []).map(item => this.convertDbTeamMemberToTeamMember(item));
    }

    // Project-team associations
    async addTeamToProject(projectId: string, teamId: string, addedBy: string): Promise<ProjectTeam> {
        // Check if team is already added to project
        const existingAssociation = await this.getProjectTeam(projectId, teamId);
        if (existingAssociation) {
            throw new Error('Team is already associated with this project');
        }

        // Verify team exists
        const team = await this.getTeam(teamId);
        if (!team) {
            throw new Error('Team not found');
        }

        const now = new Date();
        const projectTeam: ProjectTeam = {
            id: uuidv4(),
            projectId,
            teamId,
            addedAt: now
        };

        const projectTeamForDb = {
            ...projectTeam,
            addedAt: projectTeam.addedAt.toISOString()
        };

        const command = new PutCommand({
            TableName: TABLES.PROJECT_TEAMS,
            Item: projectTeamForDb
        });

        await dynamoDb.send(command);
        return projectTeam;
    }

    async removeTeamFromProject(projectId: string, teamId: string, removedBy: string): Promise<void> {
        const projectTeam = await this.getProjectTeam(projectId, teamId);
        if (!projectTeam) {
            throw new Error('Team is not associated with this project');
        }

        const command = new DeleteCommand({
            TableName: TABLES.PROJECT_TEAMS,
            Key: { id: projectTeam.id }
        });

        await dynamoDb.send(command);
    }

    async getProjectTeams(projectId: string): Promise<(ProjectTeam & { team: Team })[]> {
        const command = new QueryCommand({
            TableName: TABLES.PROJECT_TEAMS,
            IndexName: 'ProjectIdIndex',
            KeyConditionExpression: 'projectId = :projectId',
            ExpressionAttributeValues: {
                ':projectId': projectId
            }
        });

        const result = await dynamoDb.send(command);
        const projectTeams = (result.Items || []).map(item => this.convertDbProjectTeamToProjectTeam(item));

        // Get team details for each association
        const projectTeamsWithTeams = await Promise.all(
            projectTeams.map(async (projectTeam) => {
                const team = await this.getTeam(projectTeam.teamId);
                if (!team) return null;
                return { ...projectTeam, team };
            })
        );

        return projectTeamsWithTeams.filter((pt): pt is ProjectTeam & { team: Team } => pt !== null);
    }

    async getTeamProjects(teamId: string): Promise<ProjectTeam[]> {
        const command = new QueryCommand({
            TableName: TABLES.PROJECT_TEAMS,
            IndexName: 'TeamIdIndex',
            KeyConditionExpression: 'teamId = :teamId',
            ExpressionAttributeValues: {
                ':teamId': teamId
            }
        });

        const result = await dynamoDb.send(command);
        return (result.Items || []).map(item => this.convertDbProjectTeamToProjectTeam(item));
    }

    async getProjectTeam(projectId: string, teamId: string): Promise<ProjectTeam | null> {
        const command = new ScanCommand({
            TableName: TABLES.PROJECT_TEAMS,
            FilterExpression: 'projectId = :projectId AND teamId = :teamId',
            ExpressionAttributeValues: {
                ':projectId': projectId,
                ':teamId': teamId
            }
        });

        const result = await dynamoDb.send(command);

        if (!result.Items || result.Items.length === 0) {
            return null;
        }

        return this.convertDbProjectTeamToProjectTeam(result.Items[0]);
    }

    // Permission helpers
    async canUserManageTeam(teamId: string, userId: string): Promise<boolean> {
        const member = await this.getTeamMember(teamId, userId);
        return member ? (member.role === TEAM_ROLES.OWNER || member.role === TEAM_ROLES.ADMIN) : false;
    }

    async getUserTeamRole(teamId: string, userId: string): Promise<TeamRole | null> {
        const member = await this.getTeamMember(teamId, userId);
        return member ? member.role : null;
    }

    // Search and listing
    async searchTeams(query: string, userId?: string): Promise<Team[]> {
        const command = new ScanCommand({
            TableName: TABLES.TEAMS,
            FilterExpression: 'contains(#name, :query) OR contains(description, :query)',
            ExpressionAttributeNames: {
                '#name': 'name'
            },
            ExpressionAttributeValues: {
                ':query': query
            }
        });

        const result = await dynamoDb.send(command);
        let teams = (result.Items || []).map(item => this.convertDbTeamToTeam(item));

        // If userId provided, filter to teams the user can see (is a member of or public teams)
        if (userId) {
            const userTeams = await this.getUserTeams(userId);
            const userTeamIds = new Set(userTeams.map(t => t.id));
            teams = teams.filter(team => userTeamIds.has(team.id));
        }

        return teams;
    }
}