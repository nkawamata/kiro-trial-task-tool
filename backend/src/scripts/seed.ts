import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Load environment variables
config();

// Import types directly
import { ProjectStatus, TaskStatus, TaskPriority, ProjectRole } from '../../../shared/src/types';

// Create DynamoDB client for seeding
const client = new DynamoDBClient({
  region: process.env.DYNAMODB_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  },
});

const dynamoDb = DynamoDBDocumentClient.from(client);

// Table names
const TABLES = {
  USERS: 'TaskManager-Users',
  PROJECTS: 'TaskManager-Projects',
  TASKS: 'TaskManager-Tasks',
  PROJECT_MEMBERS: 'TaskManager-ProjectMembers',
  WORKLOAD: 'TaskManager-Workload',
};

async function seedData() {
  console.log('Seeding database with sample data...');

  // Create sample users
  const now = new Date().toISOString();
  const users = [
    {
      id: uuidv4(),
      cognitoId: 'sample-cognito-1',
      email: 'john@example.com',
      name: 'John Doe',
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      cognitoId: 'sample-cognito-2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      cognitoId: 'sample-cognito-3',
      email: 'bob@example.com',
      name: 'Bob Johnson',
      createdAt: now,
      updatedAt: now
    }
  ];

  // Insert users
  for (const user of users) {
    await dynamoDb.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: user
    }));
  }

  // Create sample projects
  const projects = [
    {
      id: uuidv4(),
      name: 'Website Redesign',
      description: 'Complete redesign of company website',
      ownerId: users[0].id,
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-03-31T00:00:00.000Z',
      status: ProjectStatus.ACTIVE,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      name: 'Mobile App Development',
      description: 'Develop new mobile application',
      ownerId: users[1].id,
      startDate: '2024-02-01T00:00:00.000Z',
      endDate: '2024-06-30T00:00:00.000Z',
      status: ProjectStatus.PLANNING,
      createdAt: now,
      updatedAt: now
    }
  ];

  // Insert projects
  for (const project of projects) {
    await dynamoDb.send(new PutCommand({
      TableName: TABLES.PROJECTS,
      Item: project
    }));
  }

  // Create sample tasks
  const tasks = [
    {
      id: uuidv4(),
      title: 'Design Homepage',
      description: 'Create new homepage design mockups',
      projectId: projects[0].id,
      assigneeId: users[0].id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-15T00:00:00.000Z',
      estimatedHours: 40,
      actualHours: 25,
      dependencies: [],
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: 'Implement Frontend',
      description: 'Code the frontend based on designs',
      projectId: projects[0].id,
      assigneeId: users[1].id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      startDate: '2024-01-16T00:00:00.000Z',
      endDate: '2024-02-15T00:00:00.000Z',
      estimatedHours: 80,
      dependencies: [],
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: 'Setup Development Environment',
      description: 'Configure development tools and environment',
      projectId: projects[1].id,
      assigneeId: users[2].id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      startDate: '2024-02-01T00:00:00.000Z',
      endDate: '2024-02-05T00:00:00.000Z',
      estimatedHours: 16,
      actualHours: 18,
      dependencies: [],
      createdAt: now,
      updatedAt: now
    }
  ];

  // Insert tasks
  for (const task of tasks) {
    await dynamoDb.send(new PutCommand({
      TableName: TABLES.TASKS,
      Item: task
    }));
  }

  // Create project memberships
  const memberships = [
    {
      id: uuidv4(),
      projectId: projects[0].id,
      userId: users[1].id,
      role: ProjectRole.MEMBER,
      joinedAt: now
    },
    {
      id: uuidv4(),
      projectId: projects[1].id,
      userId: users[0].id,
      role: ProjectRole.ADMIN,
      joinedAt: now
    }
  ];

  // Insert memberships
  for (const membership of memberships) {
    await dynamoDb.send(new PutCommand({
      TableName: TABLES.PROJECT_MEMBERS,
      Item: membership
    }));
  }

  // Create sample workload entries
  const workloadEntries = [
    {
      id: uuidv4(),
      userId: users[0].id,
      projectId: projects[0].id,
      taskId: tasks[0].id,
      date: '2024-01-01',
      allocatedHours: 8,
      actualHours: 7
    },
    {
      id: uuidv4(),
      userId: users[1].id,
      projectId: projects[0].id,
      taskId: tasks[1].id,
      date: '2024-01-16',
      allocatedHours: 8,
      actualHours: 8
    },
    {
      id: uuidv4(),
      userId: users[2].id,
      projectId: projects[1].id,
      taskId: tasks[2].id,
      date: '2024-02-01',
      allocatedHours: 8,
      actualHours: 9
    }
  ];

  // Insert workload entries
  for (const entry of workloadEntries) {
    await dynamoDb.send(new PutCommand({
      TableName: TABLES.WORKLOAD,
      Item: entry
    }));
  }

  console.log('Database seeded successfully!');
  console.log(`Created ${users.length} users`);
  console.log(`Created ${projects.length} projects`);
  console.log(`Created ${tasks.length} tasks`);
  console.log(`Created ${memberships.length} project memberships`);
  console.log(`Created ${workloadEntries.length} workload entries`);
}

if (require.main === module) {
  seedData().catch(console.error);
}