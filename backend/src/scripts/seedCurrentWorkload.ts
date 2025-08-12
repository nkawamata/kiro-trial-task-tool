import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { format, subDays, addDays } from 'date-fns';

// Load environment variables
config();

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
  WORKLOAD: 'TaskManager-Workload',
};

async function seedCurrentWorkloadData() {
  console.log('🌱 Adding current workload data for 2025...');

  // Get existing users, projects, and tasks
  const usersResult = await dynamoDb.send(new ScanCommand({ TableName: TABLES.USERS }));
  const projectsResult = await dynamoDb.send(new ScanCommand({ TableName: TABLES.PROJECTS }));
  const tasksResult = await dynamoDb.send(new ScanCommand({ TableName: TABLES.TASKS }));

  const users = usersResult.Items || [];
  const projects = projectsResult.Items || [];
  const tasks = tasksResult.Items || [];

  if (users.length === 0 || projects.length === 0 || tasks.length === 0) {
    console.error('❌ No users, projects, or tasks found. Please run the main seed script first.');
    console.log('Run: npm run db:seed-current-user <cognito-user-id>');
    process.exit(1);
  }

  console.log(`Found ${users.length} users, ${projects.length} projects, ${tasks.length} tasks`);

  // Generate workload entries for the current month and recent weeks
  const today = new Date();
  const workloadEntries = [];

  // Create workload entries for the past 30 days and next 30 days
  for (let i = -30; i <= 30; i++) {
    const date = addDays(today, i);
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Skip weekends for more realistic data
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Create 1-3 workload entries per day for different users and projects
    const entriesPerDay = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < entriesPerDay; j++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomProject = projects[Math.floor(Math.random() * projects.length)];
      const projectTasks = tasks.filter(task => task.projectId === randomProject.id);
      
      if (projectTasks.length === 0) continue;
      
      const randomTask = projectTasks[Math.floor(Math.random() * projectTasks.length)];
      
      // Generate realistic hours (2-8 hours per entry)
      const allocatedHours = Math.floor(Math.random() * 7) + 2;
      const actualHours = allocatedHours + (Math.random() - 0.5) * 2; // +/- 1 hour variance
      
      workloadEntries.push({
        id: uuidv4(),
        userId: randomUser.id,
        projectId: randomProject.id,
        taskId: randomTask.id,
        date: dateString,
        allocatedHours: allocatedHours,
        actualHours: Math.max(0, Math.round(actualHours * 10) / 10) // Round to 1 decimal, min 0
      });
    }
  }

  // Insert workload entries
  console.log(`📊 Creating ${workloadEntries.length} workload entries...`);
  
  for (const entry of workloadEntries) {
    await dynamoDb.send(new PutCommand({
      TableName: TABLES.WORKLOAD,
      Item: entry
    }));
  }

  // Create some specific entries for the current user for this week
  const currentUser = users.find(user => user.cognitoId && user.cognitoId.includes('-'));
  if (currentUser) {
    console.log(`👤 Adding specific workload entries for current user: ${currentUser.name}`);
    
    const thisWeekEntries = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(subDays(today, today.getDay()), i); // This week
      if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends
      
      const dateString = format(date, 'yyyy-MM-dd');
      const randomProject = projects[Math.floor(Math.random() * projects.length)];
      const projectTasks = tasks.filter(task => task.projectId === randomProject.id);
      
      if (projectTasks.length > 0) {
        const randomTask = projectTasks[0];
        
        thisWeekEntries.push({
          id: uuidv4(),
          userId: currentUser.id,
          projectId: randomProject.id,
          taskId: randomTask.id,
          date: dateString,
          allocatedHours: 8,
          actualHours: Math.floor(Math.random() * 3) + 6 // 6-8 hours
        });
      }
    }
    
    for (const entry of thisWeekEntries) {
      await dynamoDb.send(new PutCommand({
        TableName: TABLES.WORKLOAD,
        Item: entry
      }));
    }
    
    console.log(`✅ Added ${thisWeekEntries.length} entries for current user this week`);
  }

  console.log('✅ Current workload data seeded successfully!');
  console.log(`📊 Total workload entries created: ${workloadEntries.length}`);
  console.log(`📅 Date range: ${format(subDays(today, 30), 'yyyy-MM-dd')} to ${format(addDays(today, 30), 'yyyy-MM-dd')}`);
  console.log('');
  console.log('🎉 You should now see workload data in the current month!');
}

if (require.main === module) {
  seedCurrentWorkloadData().catch(console.error);
}