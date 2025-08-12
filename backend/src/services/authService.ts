import { UserService } from './userService';
import { User } from '../../../shared/src/types';

export class AuthService {
  private userService = new UserService();

  async syncUser(userData: { cognitoId: string; email: string; name: string }): Promise<User> {
    console.log('AuthService.syncUser called for cognitoId:', userData.cognitoId);
    
    // Check if user already exists
    let user = await this.userService.getUserByCognitoId(userData.cognitoId);
    
    if (user) {
      console.log('User already exists:', { id: user.id, cognitoId: user.cognitoId });
      // Update existing user if needed
      if (user.email !== userData.email || user.name !== userData.name) {
        console.log('Updating user info:', { oldEmail: user.email, newEmail: userData.email, oldName: user.name, newName: userData.name });
        user = await this.userService.updateUserProfile(user.id, {
          email: userData.email,
          name: userData.name
        });
      }
    } else {
      console.log('User does not exist, creating new user');
      // Create new user (this method now handles race conditions internally)
      user = await this.userService.createUser({
        cognitoId: userData.cognitoId,
        email: userData.email,
        name: userData.name
      });
    }
    
    return user;
  }

  async getOrCreateUser(userData: { cognitoId: string; email: string; name: string }): Promise<User> {
    return this.syncUser(userData);
  }

  async getUserFromToken(cognitoId: string): Promise<User | null> {
    return this.userService.getUserByCognitoId(cognitoId);
  }
}