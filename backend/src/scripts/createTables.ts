import { config } from 'dotenv';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { TABLES } from '../config/dynamodb';

// Load environment variables
config();

const client = new DynamoDBClient({
  region: process.env.DYNAMODB_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  },
});

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    return false;
  }
}

async function createUsersTable() {
  if (await tableExists(TABLES.USERS)) {
    console.log(`Table ${TABLES.USERS} already exists`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: TABLES.USERS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'cognitoId', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'CognitoIdIndex',
        KeySchema: [{ AttributeName: 'cognitoId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'EmailIndex',
        KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  });

  await client.send(command);
  console.log(`Created table ${TABLES.USERS}`);
}

async function createProjectsTable() {
  if (await tableExists(TABLES.PROJECTS)) {
    console.log(`Table ${TABLES.PROJECTS} already exists`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: TABLES.PROJECTS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'ownerId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'OwnerIdIndex',
        KeySchema: [{ AttributeName: 'ownerId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  });

  await client.send(command);
  console.log(`Created table ${TABLES.PROJECTS}`);
}

async function createTasksTable() {
  if (await tableExists(TABLES.TASKS)) {
    console.log(`Table ${TABLES.TASKS} already exists`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: TABLES.TASKS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'projectId', AttributeType: 'S' },
      { AttributeName: 'assigneeId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ProjectIdIndex',
        KeySchema: [{ AttributeName: 'projectId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'AssigneeIdIndex',
        KeySchema: [{ AttributeName: 'assigneeId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  });

  await client.send(command);
  console.log(`Created table ${TABLES.TASKS}`);
}

async function createProjectMembersTable() {
  if (await tableExists(TABLES.PROJECT_MEMBERS)) {
    console.log(`Table ${TABLES.PROJECT_MEMBERS} already exists`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: TABLES.PROJECT_MEMBERS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'projectId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ProjectIdIndex',
        KeySchema: [{ AttributeName: 'projectId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'UserIdIndex',
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  });

  await client.send(command);
  console.log(`Created table ${TABLES.PROJECT_MEMBERS}`);
}

async function createWorkloadTable() {
  if (await tableExists(TABLES.WORKLOAD)) {
    console.log(`Table ${TABLES.WORKLOAD} already exists`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: TABLES.WORKLOAD,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'projectId', AttributeType: 'S' },
      { AttributeName: 'date', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIdDateIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'date', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'ProjectIdDateIndex',
        KeySchema: [
          { AttributeName: 'projectId', KeyType: 'HASH' },
          { AttributeName: 'date', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  });

  await client.send(command);
  console.log(`Created table ${TABLES.WORKLOAD}`);
}


async function createTaskCommentsTable() {
  console.log(`Creating table: ${TABLES.TASK_COMMENTS}`);

  if (await tableExists(TABLES.TASK_COMMENTS)) {
    console.log(`Table ${TABLES.TASK_COMMENTS} already exists`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: TABLES.TASK_COMMENTS,
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH'
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      },
      {
        AttributeName: 'taskId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'createdAt',
        AttributeType: 'S'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'TaskIndex',
        KeySchema: [
          {
            AttributeName: 'taskId',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'createdAt',
            KeyType: 'RANGE'
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    BillingMode: 'PROVISIONED',
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  });

  try {
    await client.send(command);
    console.log(`✅ Table ${TABLES.TASK_COMMENTS} created successfully`);
  } catch (error) {
    console.error(`❌ Error creating table ${TABLES.TASK_COMMENTS}:`, error);
    throw error;
  }
}


async function createAllTables() {
  try {
    console.log('Creating DynamoDB tables...');

    await createUsersTable();
    await createProjectsTable();
    await createTasksTable();
    await createProjectMembersTable();
    await createWorkloadTable();
    await createTaskCommentsTable();

    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createAllTables();
}