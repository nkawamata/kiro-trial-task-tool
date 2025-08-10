import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { UpdateProjectDialog } from '../UpdateProjectDialog';
import { Project, ProjectStatus } from '@task-manager/shared';
import projectsReducer from '../../../store/slices/projectsSlice';

// Mock the date picker components
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ label, value, onChange }: any) => (
    <input
      data-testid={`date-picker-${label.toLowerCase().replace(/\s+/g, '-')}`}
      type="date"
      value={value ? value.toISOString().split('T')[0] : ''}
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  ),
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: jest.fn(),
}));

const mockStore = configureStore({
  reducer: {
    projects: projectsReducer,
  },
});

const mockProject: Project = {
  id: '1',
  name: 'Test Project',
  description: 'Test Description',
  ownerId: 'user1',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  status: ProjectStatus.ACTIVE,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      {component}
    </Provider>
  );
};

describe('UpdateProjectDialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open with project data', () => {
    renderWithProvider(
      <UpdateProjectDialog
        open={true}
        onClose={mockOnClose}
        project={mockProject}
      />
    );

    expect(screen.getByText('Update Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProvider(
      <UpdateProjectDialog
        open={false}
        onClose={mockOnClose}
        project={mockProject}
      />
    );

    expect(screen.queryByText('Update Project')).not.toBeInTheDocument();
  });

  it('does not render when project is null', () => {
    renderWithProvider(
      <UpdateProjectDialog
        open={true}
        onClose={mockOnClose}
        project={null}
      />
    );

    expect(screen.queryByText('Update Project')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    renderWithProvider(
      <UpdateProjectDialog
        open={true}
        onClose={mockOnClose}
        project={mockProject}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows validation error when project name is empty', async () => {
    renderWithProvider(
      <UpdateProjectDialog
        open={true}
        onClose={mockOnClose}
        project={mockProject}
      />
    );

    const nameInput = screen.getByDisplayValue('Test Project');
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('Update Project'));

    await waitFor(() => {
      expect(screen.getByText('Project name is required')).toBeInTheDocument();
    });
  });

  it('updates form data when inputs change', () => {
    renderWithProvider(
      <UpdateProjectDialog
        open={true}
        onClose={mockOnClose}
        project={mockProject}
      />
    );

    const nameInput = screen.getByDisplayValue('Test Project');
    fireEvent.change(nameInput, { target: { value: 'Updated Project Name' } });
    expect(screen.getByDisplayValue('Updated Project Name')).toBeInTheDocument();

    const descriptionInput = screen.getByDisplayValue('Test Description');
    fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } });
    expect(screen.getByDisplayValue('Updated Description')).toBeInTheDocument();
  });
});