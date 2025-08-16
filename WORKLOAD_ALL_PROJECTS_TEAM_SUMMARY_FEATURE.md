# Workload All Projects Team Summary Feature

## Overview
Enhanced the Workload Management TEAM page to show a comprehensive summary view when "All Projects" is selected, instead of just displaying a message asking users to select a specific project.

## Changes Made

### Backend Changes

#### 1. WorkloadService Enhancement
**File**: `backend/src/services/workloadService.ts`
- Added `getAllProjectsTeamWorkloadSummary()` method for summary data
- Added `getAllProjectsDailyWorkload()` method for calendar view
- Scans all workload entries for a date range across all projects
- Groups data by user and project to create comprehensive summaries
- Returns both summary and daily breakdown data

#### 2. API Endpoint Addition
**File**: `backend/src/routes/workload.ts`
- Added `GET /workload/team/all-projects` for summary data
- Added `GET /workload/team/all-projects/daily` for calendar data
- Both accept `startDate` and `endDate` query parameters
- Returns team workload data across all projects

### Frontend Changes

#### 1. Service Layer Update
**File**: `frontend/src/services/workloadService.ts`
- Added `getAllProjectsTeamWorkloadSummary()` method for summary data
- Service calls handled through Redux actions

#### 2. Redux State Management
**File**: `frontend/src/store/slices/workloadSlice.ts`
- Added `allProjectsTeamSummary` and `allProjectsDailyWorkload` to state
- Created `fetchAllProjectsTeamWorkloadSummary` async thunk for summary
- Created `fetchAllProjectsDailyWorkload` async thunk for calendar data
- Added reducer cases to handle both actions

#### 3. New Calendar Component
**File**: `frontend/src/components/workload/WorkloadAllProjectsTeamSummary.tsx`
- Calendar-style view matching the project-selected layout
- Features:
  - Monthly calendar grid with daily workload visualization
  - Team member list with project counts
  - Color-coded workload chips for each day
  - Interactive cells for daily allocation management
  - Weekend highlighting and responsive design
  - Integration with WorkloadDayAllocationDialog

#### 4. Team View Integration
**File**: `frontend/src/components/workload/WorkloadTeamView.tsx`
- Updated to handle "All Projects" selection with calendar view
- Dispatches both summary and daily workload actions when "all" is selected
- Shows `WorkloadAllProjectsTeamSummary` component with calendar layout
- Maintains existing calendar view for specific project selection
- Handles dialog refresh for both all projects and single project modes

#### 5. Component Exports
**File**: `frontend/src/components/workload/index.ts`
- Added export for `WorkloadAllProjectsTeamSummary`

## Features of the All Projects Calendar View

### Calendar Grid Layout
- **Monthly Calendar**: Shows current month with day-by-day breakdown
- **Team Members**: Listed on the left with avatar and name
- **Project Count**: Shows number of projects each member is working on
- **Daily Hours**: Color-coded chips showing allocated hours per day
- **Interactive Cells**: Click any cell to manage daily task allocations
- **Weekend Highlighting**: Weekends are visually distinguished

### Workload Visualization
- **Color-Coded Hours**:
  - Default (0h): No chip displayed
  - Success (≤4h): Green
  - Info (≤6h): Blue  
  - Warning (≤8h): Orange
  - Error (>8h): Red

### Daily Allocation Management
- Click any calendar cell to open allocation dialog
- Manage task assignments for specific dates
- Real-time updates after changes
- Consistent with single-project workflow

### Visual Indicators
- **Workload Colors**:
  - Default (0h): Gray
  - Success (≤20h): Green
  - Info (≤30h): Blue  
  - Warning (≤40h): Orange
  - Error (>40h): Red

- **Utilization Colors**:
  - Normal (≤80%): Primary blue
  - Warning (80-100%): Orange
  - Over-allocated (>100%): Red

## Usage
1. Navigate to Workload Management → Team tab
2. Select "All Projects" from the project dropdown
3. View comprehensive team summary across all projects
4. Expand individual team members to see project-specific details
5. Monitor team utilization and workload distribution

## Benefits
- **Holistic View**: See entire team workload across all projects at once
- **Resource Planning**: Identify over/under-allocated team members
- **Project Distribution**: Understand how team members are spread across projects
- **Utilization Tracking**: Monitor team capacity and efficiency
- **Quick Insights**: Get immediate overview without drilling into specific projects

## Technical Notes
- Uses scan operation for all projects data (consider adding GSI for better performance in production)
- Maintains backward compatibility with existing single-project team view
- Responsive design with proper loading states and error handling
- Follows existing UI patterns and design system