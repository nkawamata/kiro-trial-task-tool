import { ProjectMember, ProjectRole, User } from '@task-manager/shared';
import { apiClient } from './apiClient';

export interface ProjectMemberWithUser extends ProjectMember {
  user: User;
}

export interface AddMemberRequest {
  userId: string;
  role: ProjectRole;
}

export interface UpdateRoleRequest {
  role: ProjectRole;
}

export interface SearchUsersResponse {
  users: User[];
}

export const teamService = {
  async getProjectMembers(projectId: string): Promise<ProjectMemberWithUser[]> {
    const response = await apiClient.get(`/team/projects/${projectId}/members`);
    return response.data.members;
  },

  async addProjectMember(projectId: string, data: AddMemberRequest): Promise<ProjectMember> {
    const response = await apiClient.post(`/team/projects/${projectId}/members`, data);
    return response.data.member;
  },

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await apiClient.delete(`/team/projects/${projectId}/members/${userId}`);
  },

  async updateMemberRole(projectId: string, userId: string, data: UpdateRoleRequest): Promise<ProjectMember> {
    const response = await apiClient.put(`/team/projects/${projectId}/members/${userId}/role`, data);
    return response.data.member;
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await apiClient.get<SearchUsersResponse>(`/team/users/search?q=${encodeURIComponent(query)}`);
    return response.data.users;
  }
};