import { TABLES } from '../../config/dynamodb';

describe('DynamoDB Configuration', () => {
  it('should have all required table names defined', () => {
    expect(TABLES).toBeDefined();
    expect(typeof TABLES).toBe('object');
  });

  it('should have TEAMS table defined', () => {
    expect(TABLES.TEAMS).toBeDefined();
    expect(typeof TABLES.TEAMS).toBe('string');
    expect(TABLES.TEAMS.length).toBeGreaterThan(0);
  });

  it('should have TEAM_MEMBERS table defined', () => {
    expect(TABLES.TEAM_MEMBERS).toBeDefined();
    expect(typeof TABLES.TEAM_MEMBERS).toBe('string');
    expect(TABLES.TEAM_MEMBERS.length).toBeGreaterThan(0);
  });

  it('should have PROJECT_TEAMS table defined', () => {
    expect(TABLES.PROJECT_TEAMS).toBeDefined();
    expect(typeof TABLES.PROJECT_TEAMS).toBe('string');
    expect(TABLES.PROJECT_TEAMS.length).toBeGreaterThan(0);
  });

  it('should have unique table names', () => {
    const tableNames = Object.values(TABLES);
    const uniqueNames = new Set(tableNames);
    expect(uniqueNames.size).toBe(tableNames.length);
  });

  it('should use consistent naming convention', () => {
    Object.values(TABLES).forEach(tableName => {
      expect(tableName).toMatch(/^TaskManager-[A-Za-z]+$/);
    });
  });
});