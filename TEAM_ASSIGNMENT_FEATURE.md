# Team Member Assignment Feature

This document describes the newly implemented team member assignment feature for the task management application.

## Overview

The team member assignment feature allows project owners and administrators to:
- Add team members to projects with specific roles
- Remove team members from projects
- Update team member roles
- View all team members in a project

## Components

### Backend Components

1. **TeamService** (`backend/src/services/teamService.ts`)
   - Handles all team member operations
   - Manages project member permissions
   - Integrates with DynamoDB for data persistence

2. **Team Routes** (`backend/src/routes/team.ts`)
   - RESTful API endpoints for team management
   - Authentication and authorization middleware
   - User search functionality

### Frontend Components

1. **TeamManagement** (`frontend/src/components/team/TeamManagement.tsx`)
   - Main component for displaying and managing team members
   - Table view with member details and actions
   - Role-based action menus

2. **AddMemberDialog** (`frontend/src/components/team/AddMemberDialog.tsx`)
   - Modal dialog for adding new team members
   - User search functionality
   - Role selection

3. **TeamMemberSelector** (`frontend/src/components/team/TeamMemberSelector.tsx`)
   - Reusable component for selecting team members
   - Used in project creation/update dialogs
   - Chip-based member display

4. **Team Redux Slice** (`frontend/src/store/slices/teamSlice.ts`)
   - State management for team operations
   - Async thunks for API calls
   - Error handling

## API Endpoints

### Team Management
- `GET /api/team/projects/:projectId/members` - Get project members
- `POST /api/team/projects/:projectId/members` - Add project member
- `DELETE /api/team/projects/:projectId/members/:memberId` - Remove project member
- `PUT /api/team/projects/:projectId/members/:memberId/role` - Update member role

### User Search
- `GET /api/team/users/search?q=query` - Search users for adding to projects

## Roles and Permissions

### Project Roles
- **Owner**: Full project control, cannot be removed
- **Admin**: Can manage team members and project settings
- **Member**: Can view and edit project content
- **Viewer**: Read-only access to project

### Permission Matrix
| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| View project | ✓ | ✓ | ✓ | ✓ |
| Edit project | ✓ | ✓ | ✓ | ✗ |
| Manage team | ✓ | ✓ | ✗ | ✗ |
| Delete project | ✓ | ✗ | ✗ | ✗ |

## Usage

### Adding Team Members
1. Navigate to a project
2. Click on the "Team" tab
3. Click "Add Member" button
4. Search for users by name or email
5. Select user and assign role
6. Click "Add Member"

### Managing Team Members
1. In the Team tab, click the menu icon (⋮) next to a member
2. Select action:
   - Change role (Make Admin/Member/Viewer)
   - Remove from project

### Project Creation with Team
1. When creating a new project, scroll to the "Team Members" section
2. Search and add team members with their roles
3. Team members will be automatically added when the project is created

## Database Schema

### ProjectMembers Table
```
{
  id: string (Primary Key)
  projectId: string (GSI)
  userId: string (GSI)
  role: ProjectRole
  joinedAt: Date
}
```

## Future Enhancements

1. **Bulk Operations**: Add/remove multiple members at once
2. **Team Templates**: Save and reuse team configurations
3. **Invitation System**: Send email invitations to new members
4. **Activity Logging**: Track team member changes
5. **Advanced Permissions**: Custom role definitions
6. **Team Analytics**: Member activity and contribution metrics

## Testing

To test the feature:
1. Start the backend server
2. Start the frontend application
3. Create or open a project
4. Navigate to the Team tab
5. Try adding, removing, and updating team members

## Dependencies

### Backend
- AWS SDK for DynamoDB operations
- Express.js for routing
- JWT for authentication

### Frontend
- Material-UI for components
- Redux Toolkit for state management
- Axios for API calls

## Configuration

Ensure the following environment variables are set:
- `PROJECT_MEMBERS_TABLE`: DynamoDB table name for project members
- `USERS_TABLE`: DynamoDB table name for users

The feature integrates seamlessly with the existing authentication and project management systems.