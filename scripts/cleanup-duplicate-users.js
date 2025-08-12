const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

const client = new DynamoDBClient({
  region: process.env.DYNAMODB_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000'
});

const dynamoDb = DynamoDBDocumentClient.from(client);

async function cleanupDuplicateUsers() {
  console.log('🧹 Cleaning up duplicate users...');
  
  try {
    // Get all users
    const command = new ScanCommand({
      TableName: 'TaskManager-Users'
    });

    const result = await dynamoDb.send(command);
    const users = result.Items || [];
    
    console.log(`Found ${users.length} total users`);
    
    // Group users by cognitoId
    const usersByCognitoId = {};
    users.forEach(user => {
      if (!usersByCognitoId[user.cognitoId]) {
        usersByCognitoId[user.cognitoId] = [];
      }
      usersByCognitoId[user.cognitoId].push(user);
    });
    
    // Find duplicates
    const duplicates = [];
    Object.keys(usersByCognitoId).forEach(cognitoId => {
      const usersWithSameCognitoId = usersByCognitoId[cognitoId];
      if (usersWithSameCognitoId.length > 1) {
        console.log(`Found ${usersWithSameCognitoId.length} users with cognitoId: ${cognitoId}`);
        
        // Keep the first one (oldest), mark others for deletion
        const sortedUsers = usersWithSameCognitoId.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        const keepUser = sortedUsers[0];
        const deleteUsers = sortedUsers.slice(1);
        
        console.log(`  Keeping user: ${keepUser.id} (created: ${keepUser.createdAt})`);
        deleteUsers.forEach(user => {
          console.log(`  Marking for deletion: ${user.id} (created: ${user.createdAt})`);
          duplicates.push(user);
        });
      }
    });
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate users found!');
      return;
    }
    
    console.log(`\n🗑️  Deleting ${duplicates.length} duplicate users...`);
    
    // Delete duplicates
    for (const user of duplicates) {
      try {
        const deleteCommand = new DeleteCommand({
          TableName: 'TaskManager-Users',
          Key: { id: user.id }
        });
        
        await dynamoDb.send(deleteCommand);
        console.log(`✅ Deleted duplicate user: ${user.id} (${user.email})`);
      } catch (error) {
        console.error(`❌ Failed to delete user ${user.id}:`, error.message);
      }
    }
    
    console.log('\n🎉 Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

cleanupDuplicateUsers();