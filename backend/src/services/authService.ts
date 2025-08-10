import { UserService } from './userService';
import { User } from '../../../shared/src/types';

export class AuthService {
  private userService = new UserService();

  async syncUser(userData: { cognitoId: string; email: string; name: string }): Promise<User> {
    // Check if user already exists
    let user = await this.userService.getUserByCognitoId(userData.cognitoId);
    
    if (user) {
      // Update existing user if needed
      if (user.email !== userData.email || user.name !== userData.name) {
        user = await this.userService.updateUserProfile(user.id, {
          email: userData.email,
          name: userData.name
        });
      }
    } else {
      // Create new user
      user = await this.userService.createUser({
        cognitoId: userData.cognitoId,
        email: userData.email,
        name: userData.name
      });
    }
    
    return user;
  }
}