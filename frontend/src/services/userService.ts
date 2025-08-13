import { User } from '@task-manager/shared';
import { apiClient } from './apiClient';

export interface UserResponse {
  user: User;
}

export interface UsersResponse {
  users: User[];
}

export const userService = {
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<UserResponse>('/users/me');
    return response.data.user;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await apiClient.put<UserResponse>('/users/me', updates);
    return response.data.user;
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await apiClient.get<UsersResponse>(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data.users;
  },

  async getUser(userId: string): Promise<User> {
    const response = await apiClient.get<UserResponse>(`/users/${userId}`);
    return response.data.user;
  }
};