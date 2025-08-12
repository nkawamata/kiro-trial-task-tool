import { GetCommand, PutCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../../shared/src/types';
import { dynamoDb, TABLES } from '../config/dynamodb';

export class UserService {
  private convertDbUserToUser(dbUser: any): User {
    return {
      ...dbUser,
      createdAt: new Date(dbUser.createdAt),
      updatedAt: new Date(dbUser.updatedAt)
    };
  }
  async getUserProfile(userId: string): Promise<User> {
    const command = new GetCommand({
      TableName: TABLES.USERS,
      Key: { id: userId }
    });

    const result = await dynamoDb.send(command);
    
    if (!result.Item) {
      throw new Error('User not found');
    }

    return this.convertDbUserToUser(result.Item);
  }

  async getUserByCognitoId(cognitoId: string): Promise<User | null> {
    const command = new ScanCommand({
      TableName: TABLES.USERS,
      FilterExpression: 'cognitoId = :cognitoId',
      ExpressionAttributeValues: {
        ':cognitoId': cognitoId
      }
    });

    const result = await dynamoDb.send(command);
    
    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return this.convertDbUserToUser(result.Items[0]);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const user: User = {
      id: uuidv4(),
      ...userData,
      createdAt: now,
      updatedAt: now
    };

    // Convert Date objects to ISO strings for DynamoDB storage
    const userForDb = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };

    try {
      const command = new PutCommand({
        TableName: TABLES.USERS,
        Item: userForDb,
        // Add condition to prevent overwriting existing items with same ID
        ConditionExpression: 'attribute_not_exists(id)'
      });

      await dynamoDb.send(command);
      console.log('User created successfully:', { id: user.id, cognitoId: user.cognitoId });
      return user;
    } catch (error: any) {
      // If condition fails, it means the user was created by another request
      if (error.name === 'ConditionalCheckFailedException') {
        console.log('User creation failed due to race condition, fetching existing user');
        const existingUser = await this.getUserByCognitoId(userData.cognitoId);
        if (existingUser) {
          return existingUser;
        }
      }
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const updateExpression = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updates.name) {
      updateExpression.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = updates.name;
    }

    if (updates.email) {
      updateExpression.push('email = :email');
      expressionAttributeValues[':email'] = updates.email;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { id: userId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await dynamoDb.send(command);
    return this.convertDbUserToUser(result.Attributes);
  }

  async searchUsers(query: string): Promise<User[]> {
    console.log('UserService.searchUsers called with query:', query);
    
    // Make search case-insensitive by converting to lowercase
    const lowerQuery = query.toLowerCase();
    
    const command = new ScanCommand({
      TableName: TABLES.USERS,
      FilterExpression: 'contains(#name, :query) OR contains(email, :query) OR contains(#name, :lowerQuery) OR contains(email, :lowerQuery)',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':query': query,
        ':lowerQuery': lowerQuery
      }
    });

    const result = await dynamoDb.send(command);
    console.log('DynamoDB scan result:', {
      count: result.Items?.length || 0,
      items: result.Items?.map(item => ({ 
        id: item.id, 
        email: item.email, 
        name: item.name,
        cognitoId: item.cognitoId 
      }))
    });
    
    const users = (result.Items || []).map(item => this.convertDbUserToUser(item));
    console.log('Converted users:', users.map(u => ({ id: u.id, email: u.email, name: u.name })));
    
    return users;
  }

  async getAllUsers(): Promise<User[]> {
    console.log('UserService.getAllUsers called');
    
    const command = new ScanCommand({
      TableName: TABLES.USERS
    });

    const result = await dynamoDb.send(command);
    console.log('All users in database:', {
      count: result.Items?.length || 0,
      items: result.Items?.map(item => ({ 
        id: item.id, 
        email: item.email, 
        name: item.name,
        cognitoId: item.cognitoId 
      }))
    });
    
    return (result.Items || []).map(item => this.convertDbUserToUser(item));
  }

  async getOrCreateUserByCognitoId(cognitoId: string, userData?: { email?: string; name?: string }): Promise<User> {
    // First try to find existing user
    let user = await this.getUserByCognitoId(cognitoId);
    
    if (!user) {
      // Create new user if not found
      user = await this.createUser({
        cognitoId,
        email: userData?.email || `user-${cognitoId.substring(0, 8)}@example.com`,
        name: userData?.name || 'New User'
      });
    }
    
    return user;
  }
}