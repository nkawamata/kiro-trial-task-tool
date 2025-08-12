import { apiClient } from './apiClient';
import { User } from '../../../shared/src/types';
import { OIDCUser } from '../types/oidc';

export interface AuthResponse {
  user: User | null;
  tokenInfo: {
    sub: string;
    email?: string;
    name?: string;
  };
  message?: string;
}

export class AuthService {
  /**
   * Get current user information from the backend
   * This will auto-create the user if AUTO_CREATE_USERS is enabled
   */
  async getCurrentUser(): Promise<AuthResponse> {
    const response = await apiClient.get<AuthResponse>('/auth/me');
    return response.data;
  }

  /**
   * Manually create a user in the database
   * Useful when auto-creation is disabled
   */
  async createUser(): Promise<{ user: User }> {
    const response = await apiClient.post<{ user: User }>('/auth/create-user');
    return response.data;
  }

  /**
   * Sync user data with the backend
   * Updates user information if it has changed
   */
  async syncUser(userData: { cognitoId: string; email: string; name: string }): Promise<{ user: User }> {
    const response = await apiClient.post<{ user: User }>('/auth/sync-user', userData);
    return response.data;
  }

  /**
   * Extract user information from OIDC user object
   */
  extractUserInfo(oidcUser: OIDCUser): { cognitoId: string; email: string; name: string } {
    return {
      cognitoId: oidcUser.sub,
      email: oidcUser.email || oidcUser.profile?.email || `user-${oidcUser.sub.substring(0, 8)}@example.com`,
      name: oidcUser.name || 
            oidcUser.profile?.name ||
            (oidcUser.given_name && oidcUser.family_name ? 
             `${oidcUser.given_name} ${oidcUser.family_name}` : 
             oidcUser.preferred_username || 
             oidcUser.profile?.preferred_username || 
             'New User')
    };
  }

  /**
   * Handle user login flow with auto-creation
   */
  async handleUserLogin(oidcUser: any): Promise<User | null> {
    try {
      // First, try to get current user (this will auto-create if enabled)
      const authResponse = await this.getCurrentUser();
      
      if (authResponse.user) {
        return authResponse.user;
      }

      // If no user was returned, try manual creation
      if (authResponse.message?.includes('Auto-creation may be disabled')) {
        console.log('Auto-creation is disabled, attempting manual user creation...');
        const createResponse = await this.createUser();
        return createResponse.user;
      }

      return null;
    } catch (error) {
      console.error('Error handling user login:', error);
      
      // If getCurrentUser fails, try manual sync
      try {
        const userInfo = this.extractUserInfoFromAny(oidcUser);
        const syncResponse = await this.syncUser(userInfo);
        return syncResponse.user;
      } catch (syncError) {
        console.error('Error syncing user:', syncError);
        return null;
      }
    }
  }

  /**
   * Extract user information from any OIDC user object (flexible)
   */
  extractUserInfoFromAny(oidcUser: any): { cognitoId: string; email: string; name: string } {
    // Try to get sub from various locations
    const sub = oidcUser.sub || oidcUser.profile?.sub;
    
    // Try to get email from various locations
    const email = oidcUser.email || 
                  oidcUser.profile?.email || 
                  `user-${sub?.substring(0, 8)}@example.com`;
    
    // Try to get name from various locations
    const name = oidcUser.name || 
                 oidcUser.profile?.name ||
                 (oidcUser.given_name && oidcUser.family_name ? 
                  `${oidcUser.given_name} ${oidcUser.family_name}` : 
                  oidcUser.preferred_username || 
                  oidcUser.profile?.preferred_username || 
                  'New User');

    return {
      cognitoId: sub,
      email,
      name
    };
  }
}

export const authService = new AuthService();