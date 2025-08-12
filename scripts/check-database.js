const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

const client = new DynamoDBClient({
  region: process.env.DYNAMODB_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000'
});

const dynamoDb = DynamoDBDocumentClient.from(client);

async function checkDatabase() {
  console.log('🔍 Checking Users table in DynamoDB...');
  console.log('Database endpoint:', process.env.DYNAMODB_ENDPOINT || 'AWS DynamoDB');
  
  try {
    const command = new ScanCommand({
      TableName: 'TaskManager-Users'
    });

    const result = await dynamoDb.send(command);
    
    console.log('\n📊 Users table contents:');
    console.log('Total users:', result.Items?.length || 0);
    
    if (result.Items && result.Items.length > 0) {
      console.log('\nUsers found:');
      result.Items.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   CognitoId: ${user.cognitoId}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No users found in database!');
      console.log('This means the auto user creation is not working.');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    
    if (error.message.includes('ResourceNotFoundException')) {
      console.log('\n💡 The Users table does not exist.');
      console.log('Run: cd backend && npm run db:create-tables');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Cannot connect to DynamoDB.');
      console.log('If using DynamoDB Local, make sure it\'s running on port 8000');
    }
  }
}

checkDatabase();