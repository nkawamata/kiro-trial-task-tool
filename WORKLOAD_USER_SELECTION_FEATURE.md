# Workload User Selection Feature

## Overview
Enhanced the Workload Allocation Dialog to include project-based team member selection, allowing managers to allocate workload to project team members instead of just the current user.

## Changes Made

### Frontend Changes

#### 1. Enhanced WorkloadAllocationDialog (`frontend/src/components/workload/WorkloadAllocationDialog.tsx`)
- **Project-First Flow**: Project selection moved to top of form
- **Team Member Selection**: Users filtered to show only project team members
- **Integrated Team Management**: Uses existing team slice to fetch project members
- **Guided UX**: Helper text guides users to select project first
- **Form validation includes user selection requirement
- **Data Integrity**: Disabled user/project selection when editing existing entries

#### 2. Updated WorkloadDayAllocationDialog (`frontend/src/components/workload/WorkloadDayAllocationDialog.tsx`)
- Passes `preselectedUserId` to the allocation dialog
- Maintains context of which user's workload is being managed

### Backend Support
The backend already supported user-specific workload allocation:
- `WorkloadEntry` includes `userId` field
- Team management API endpoints for project members
- `TeamService` provides project member functionality

## Features

### Project-Based Team Selection
- **Project First**: Must select project before seeing team members
- **Team Members Only**: Shows only users who are members of the selected project
- **Visual User Display**: Shows both name and email in dropdown
- **Validation**: Requires both project and user selection before allowing form submission

### Form Behavior
- **New Allocations**: Select project first, then choose from project team members
- **Editing**: Project and user selection disabled to maintain data integrity
- **Guided Flow**: Helper text explains the selection process
- **Context Awareness**: When opened from a specific user's calendar, that user is pre-selected

### Team Integration
- **Existing Team Data**: Leverages existing team management functionality
- **Project Members**: Automatically fetches team members when project is selected
- **Role Awareness**: Uses existing project member roles and permissions

## Usage

### For Managers
1. Open workload allocation dialog
2. **Select project first** from the dropdown
3. Choose team member from project members
4. Select task, hours, and date
5. Submit allocation

### For Individual Users
- Default behavior unchanged - current user is pre-selected when they're a project member
- Must still select project first to see available tasks

### From Calendar Views
- When clicking on a specific user's calendar day, that user is pre-selected
- Project must still be selected first to enable user selection

## Technical Implementation

### State Management
```typescript
// Uses existing team slice
interface TeamState {
  members: Record<string, ProjectMemberWithUser[]>; // projectId -> members
  loading: boolean;
  error: string | null;
}
```

### Form Data Structure
```typescript
const formData = {
  projectId: string;     // MOVED: Project selection first
  userId: string;        // NEW: Selected team member ID
  taskId: string;
  allocatedHours: number;
  date: Date;
}
```

### API Integration
- Uses existing team management endpoints
- Leverages `fetchProjectMembers(projectId)` action
- Uses existing workload allocation API with userId parameter
- No backend changes required

## Benefits

1. **Project-Scoped Management**: Managers can allocate work only to relevant project team members
2. **Team Coordination**: Better visibility and control over project team workload
3. **Resource Planning**: Easier to balance workload across project team members
4. **Guided User Experience**: Clear flow from project to team member to task
5. **Data Integrity**: Prevents accidental changes when editing existing allocations
6. **Security**: Users can only see and allocate to team members of projects they have access to

## Future Enhancements

1. **Role-based Permissions**: Restrict allocation based on project roles (manager, member, etc.)
2. **Cross-Project Allocation**: Allow managers to see users across multiple projects
3. **Bulk Allocation**: Select multiple team members for the same task
4. **User Availability**: Show team member capacity/availability in selection
5. **Recent Allocations**: Show recently allocated team members for quick selection