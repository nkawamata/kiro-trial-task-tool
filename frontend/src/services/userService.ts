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
    // For now, we'll use the search endpoint to find a specific user
    // In a real app, you might want a dedicated endpoint for this
    const users = await this.searchUsers(userId);
    const user = users.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
};