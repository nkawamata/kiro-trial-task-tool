# Gantt Chart Implementation

This directory contains the Gantt chart implementation for the multi-project task management tool.

## Components

### GanttChart (Page)
- Main Gantt chart page component
- Handles project selection, filtering, and view mode controls
- Located at `/gantt` and `/gantt/:projectId`

### GanttChartView
- Main container component that orchestrates the Gantt chart display
- Converts tasks to Gantt format and groups them by project
- Provides task sidebar with details and status information

### GanttTimeline
- Custom timeline visualization component
- Renders task bars, dependencies, and time scale
- Supports multiple view modes (day, week, month, quarter)

## Features

### ✅ Implemented
- Task timeline visualization with progress indicators
- Multi-project view and project-specific filtering
- Task status and priority filtering
- Interactive task bars with click navigation
- Dependency visualization with arrows
- Today indicator line
- Multiple view modes (day, week, month, quarter) - defaults to daily view with improved readability
- Task details in sidebar with status chips
- Responsive design
- Two-row header layout for daily view (month/day separation)
- Fixed date alignment issues - tasks now align correctly with timeline dates
- JST timezone compatibility - proper date handling for Japan Standard Time users

### 🚧 Planned Enhancements
- Drag-and-drop task editing
- Real-time task updates
- Resource allocation overlay
- Critical path highlighting
- Milestone markers
- Zoom controls functionality
- Export to PDF/PNG
- Print support

## Usage

```typescript
import { GanttChart } from '../pages/GanttChart';

// Navigate to Gantt chart
navigate('/gantt'); // All projects
navigate('/gantt/project-id'); // Specific project
```

## Data Requirements

Tasks must have both `startDate` and `endDate` to appear in the Gantt chart. Tasks without dates will be filtered out with a helpful message.

## Styling

The Gantt chart uses Material-UI components and follows the application's design system. Task colors are determined by priority:

- **Urgent**: Red (#d32f2f)
- **High**: Orange (#f57c00)
- **Medium**: Blue (#1976d2)
- **Low**: Green (#388e3c)

## Performance

The component is optimized for:
- Large numbers of tasks through virtualization concepts
- Efficient date calculations with memoization
- Minimal re-renders through proper dependency arrays