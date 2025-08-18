import { Team, TeamMember, TeamRole, User, ProjectTeam } from '@task-manager/shared';
import { apiClient } from './apiClient';

export interface TeamWithRole extends Team {
  role: TeamRole;
}

export interface TeamMemberWithUser extends TeamMember {
  user: User;
}

export interface ProjectTeamWithTeam extends ProjectTeam {
  team: Team;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

export interface AddTeamMemberRequest {
  userId: string;
  role: TeamRole;
}

export interface UpdateTeamMemberRoleRequest {
  role: TeamRole;
}

export interface SearchTeamsResponse {
  teams: Team[];
}

export interface GetUserTeamsResponse {
  teams: TeamWithRole[];
}

export interface GetTeamResponse {
  team: Team;
  userRole: TeamRole;
}

export interface GetTeamMembersResponse {
  members: TeamMemberWithUser[];
}

export interface GetProjectTeamsResponse {
  projectTeams: ProjectTeamWithTeam[];
}

export const teamsService = {
  // Team CRUD operations
  async createTeam(data: CreateTeamRequest): Promise<Team> {
    const response = await apiClient.post('/teams', data);
    return response.data.team;
  },

  async getUserTeams(): Promise<TeamWithRole[]> {
    const response = await apiClient.get<GetUserTeamsResponse>('/teams/my-teams');
    return response.data.teams;
  },

  async searchTeams(query: string): Promise<Team[]> {
    const response = await apiClient.get<SearchTeamsResponse>(`/teams/search?q=${encodeURIComponent(query)}`);
    return response.data.teams;
  },

  async getTeam(teamId: string): Promise<{ team: Team; userRole: TeamRole }> {
    const response = await apiClient.get<GetTeamResponse>(`/teams/${teamId}`);
    return { team: response.data.team, userRole: response.data.userRole };
  },

  async updateTeam(teamId: string, data: UpdateTeamRequest): Promise<Team> {
    const response = await apiClient.put(`/teams/${teamId}`, data);
    return response.data.team;
  },

  async deleteTeam(teamId: string): Promise<void> {
    await apiClient.delete(`/teams/${teamId}`);
  },

  // Team member management
  async getTeamMembers(teamId: string): Promise<TeamMemberWithUser[]> {
    const response = await apiClient.get<GetTeamMembersResponse>(`/teams/${teamId}/members`);
    return response.data.members;
  },

  async addTeamMember(teamId: string, data: AddTeamMemberRequest): Promise<TeamMember> {
    const response = await apiClient.post(`/teams/${teamId}/members`, data);
    return response.data.member;
  },

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await apiClient.delete(`/teams/${teamId}/members/${userId}`);
  },

  async updateTeamMemberRole(teamId: string, userId: string, data: UpdateTeamMemberRoleRequest): Promise<TeamMember> {
    const response = await apiClient.put(`/teams/${teamId}/members/${userId}/role`, data);
    return response.data.member;
  },

  // Project-team associations
  async addTeamToProject(teamId: string, projectId: string): Promise<ProjectTeam> {
    const response = await apiClient.post(`/teams/${teamId}/projects/${projectId}`);
    return response.data.projectTeam;
  },

  async removeTeamFromProject(teamId: string, projectId: string): Promise<void> {
    await apiClient.delete(`/teams/${teamId}/projects/${projectId}`);
  },

  async getProjectTeams(projectId: string): Promise<ProjectTeamWithTeam[]> {
    const response = await apiClient.get<GetProjectTeamsResponse>(`/projects/${projectId}/teams`);
    return response.data.projectTeams;
  }
};