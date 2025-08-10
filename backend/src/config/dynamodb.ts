import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

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

export const dynamoDb = DynamoDBDocumentClient.from(client);

// Table names
export const TABLES = {
  USERS: process.env.USERS_TABLE || 'TaskManager-Users',
  PROJECTS: process.env.PROJECTS_TABLE || 'TaskManager-Projects',
  TASKS: process.env.TASKS_TABLE || 'TaskManager-Tasks',
  PROJECT_MEMBERS: process.env.PROJECT_MEMBERS_TABLE || 'TaskManager-ProjectMembers',
  WORKLOAD: process.env.WORKLOAD_TABLE || 'TaskManager-Workload',
} as const;