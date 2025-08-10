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

async function seedDataForCurrentUser() {
  // Get the current user's Cognito ID from command line argument
  const cognitoUserId = process.argv[2];
  
  if (!cognitoUserId) {
    console.error('❌ Please provide your Cognito user ID as an argument');
    console.log('Usage: npm run db:seed-current-user <cognito-user-id>');
    console.log('Example: npm run db:seed-current-user 27c4ca98-40d1-7088-9a19-628faf26f0fd');
    process.exit(1);
  }

  console.log(`🌱 Seeding database with data for Cognito user: ${cognitoUserId}`);

  const now = new Date().toISOString();
  const currentUserId = uuidv4();

  // Create/update the current user
  const currentUser = {
    id: currentUserId,
    cognitoId: cognitoUserId,
    email: 'user@example.com', // This will be updated when they first authenticate
    name: 'Current User',
    createdAt: now,
    updatedAt: now
  };

  // Insert current user
  await dynamoDb.send(new PutCommand({
    TableName: TABLES.USERS,
    Item: currentUser
  }));

  // Create additional team members
  const teamMembers = [
    {
      id: uuidv4(),
      cognitoId: 'team-member-1',
      email: 'alice@example.com',
      name: 'Alice Johnson',
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      cognitoId: 'team-member-2',
      email: 'bob@example.com',
      name: 'Bob Wilson',
      createdAt: now,
      updatedAt: now
    }
  ];

  // Insert team members
  for (const member of teamMembers) {
    await dynamoDb.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: member
    }));
  }

  // Create projects owned by the current user
  const projects = [
    {
      id: uuidv4(),
      name: 'Website Redesign Project',
      description: 'Complete redesign of the company website with modern UI/UX',
      ownerId: currentUserId, // Owned by current user
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-03-31T00:00:00.000Z',
      status: ProjectStatus.ACTIVE,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      name: 'Mobile App Development',
      description: 'Develop a new mobile application for iOS and Android',
      ownerId: currentUserId, // Owned by current user
      startDate: '2024-02-01T00:00:00.000Z',
      endDate: '2024-06-30T00:00:00.000Z',
      status: ProjectStatus.PLANNING,
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      name: 'API Integration Project',
      description: 'Integrate third-party APIs and improve backend performance',
      ownerId: currentUserId, // Owned by current user
      startDate: '2024-03-01T00:00:00.000Z',
      endDate: '2024-05-31T00:00:00.000Z',
      status: ProjectStatus.ACTIVE,
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

  // Create tasks for the projects
  const tasks = [
    // Website Redesign Project tasks
    {
      id: uuidv4(),
      title: 'Design Homepage Layout',
      description: 'Create wireframes and mockups for the new homepage',
      projectId: projects[0].id,
      assigneeId: currentUserId,
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
      title: 'Implement Responsive Design',
      description: 'Code the responsive frontend based on approved designs',
      projectId: projects[0].id,
      assigneeId: teamMembers[0].id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      startDate: '2024-01-16T00:00:00.000Z',
      endDate: '2024-02-15T00:00:00.000Z',
      estimatedHours: 60,
      dependencies: [],
      createdAt: now,
      updatedAt: now
    },
    // Mobile App Development tasks
    {
      id: uuidv4(),
      title: 'Setup Development Environment',
      description: 'Configure React Native development environment',
      projectId: projects[1].id,
      assigneeId: teamMembers[1].id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      startDate: '2024-02-01T00:00:00.000Z',
      endDate: '2024-02-05T00:00:00.000Z',
      estimatedHours: 16,
      actualHours: 18,
      dependencies: [],
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: 'Design App Architecture',
      description: 'Plan the overall architecture and data flow',
      projectId: projects[1].id,
      assigneeId: currentUserId,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      startDate: '2024-02-06T00:00:00.000Z',
      endDate: '2024-02-20T00:00:00.000Z',
      estimatedHours: 32,
      actualHours: 20,
      dependencies: [],
      createdAt: now,
      updatedAt: now
    },
    // API Integration Project tasks
    {
      id: uuidv4(),
      title: 'API Documentation Review',
      description: 'Review and document all third-party API requirements',
      projectId: projects[2].id,
      assigneeId: currentUserId,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      startDate: '2024-03-01T00:00:00.000Z',
      endDate: '2024-03-10T00:00:00.000Z',
      estimatedHours: 24,
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

  // Create project memberships (add team members to projects)
  const memberships = [
    {
      id: uuidv4(),
      projectId: projects[0].id,
      userId: teamMembers[0].id,
      role: ProjectRole.MEMBER,
      joinedAt: now
    },
    {
      id: uuidv4(),
      projectId: projects[1].id,
      userId: teamMembers[1].id,
      role: ProjectRole.MEMBER,
      joinedAt: now
    },
    {
      id: uuidv4(),
      projectId: projects[2].id,
      userId: teamMembers[0].id,
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

  // Create workload entries
  const workloadEntries = [
    {
      id: uuidv4(),
      userId: currentUserId,
      projectId: projects[0].id,
      taskId: tasks[0].id,
      date: '2024-01-01',
      allocatedHours: 8,
      actualHours: 7
    },
    {
      id: uuidv4(),
      userId: currentUserId,
      projectId: projects[1].id,
      taskId: tasks[3].id,
      date: '2024-02-06',
      allocatedHours: 6,
      actualHours: 5
    },
    {
      id: uuidv4(),
      userId: teamMembers[0].id,
      projectId: projects[0].id,
      taskId: tasks[1].id,
      date: '2024-01-16',
      allocatedHours: 8,
      actualHours: 8
    }
  ];

  // Insert workload entries
  for (const entry of workloadEntries) {
    await dynamoDb.send(new PutCommand({
      TableName: TABLES.WORKLOAD,
      Item: entry
    }));
  }

  console.log('✅ Database seeded successfully for current user!');
  console.log(`👤 Created user: ${currentUser.name} (${cognitoUserId})`);
  console.log(`👥 Created ${teamMembers.length} team members`);
  console.log(`📁 Created ${projects.length} projects owned by current user`);
  console.log(`📋 Created ${tasks.length} tasks`);
  console.log(`🤝 Created ${memberships.length} project memberships`);
  console.log(`⏰ Created ${workloadEntries.length} workload entries`);
  console.log('');
  console.log('🎉 You should now see projects when you visit /api/projects!');
}

if (require.main === module) {
  seedDataForCurrentUser().catch(console.error);
}