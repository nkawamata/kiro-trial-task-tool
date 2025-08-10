# Project Components

This directory contains React components related to project management functionality.

## Components

### CreateProjectDialog
A dialog component for creating new projects with the following features:
- Form validation for required fields
- Date picker for start and end dates
- Status selection dropdown
- Error handling and loading states

### UpdateProjectDialog
A dialog component for updating existing projects with the following features:
- Pre-populated form fields with current project data
- Same validation and UI as CreateProjectDialog
- Handles project updates through Redux store
- Prevents updates when project is null

## Usage

### In Dashboard
```tsx
import { CreateProjectDialog, UpdateProjectDialog } from '../components/projects';

// Create new project
<CreateProjectDialog
  open={createDialogOpen}
  onClose={() => setCreateDialogOpen(false)}
/>

// Update existing project
<UpdateProjectDialog
  open={updateDialogOpen}
  onClose={() => setUpdateDialogOpen(false)}
  project={selectedProject}
/>
```

### In ProjectView
```tsx
import { UpdateProjectDialog } from '../components/projects';

<UpdateProjectDialog
  open={updateDialogOpen}
  onClose={() => setUpdateDialogOpen(false)}
  project={project}
/>
```

## Features

- **Form Validation**: Both dialogs validate required fields and show appropriate error messages
- **Date Handling**: Uses Material-UI DatePicker with proper date formatting
- **Status Management**: Dropdown with all available project statuses
- **Loading States**: Shows loading indicators during API calls
- **Error Handling**: Displays error messages for failed operations
- **Responsive Design**: Works well on different screen sizes

## Dependencies

- Material-UI components for UI elements
- Material-UI DatePicker for date selection
- Redux Toolkit for state management
- React hooks for local state management

## Testing

Tests are located in the `__tests__` directory and cover:
- Component rendering with different props
- Form validation
- User interactions
- Error states