import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import WorkloadTeamView from '../WorkloadTeamView';
import teamsSlice from '../../../store/slices/teamsSlice';
import { workloadService } from '../../../services/workloadService';

// Mock the workload service
jest.mock('../../../services/workloadService');
const mockWorkloadService = workloadService as jest.Mocked<typeof workloadService>;

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      teams: teamsSlice
    },
    preloadedState: {
      teams: {
        teams: [],
        selectedTeam: null,
        loading: false,
        error: null,
        ...initialState
      }
    }
  });
};

const renderWithProviders = (component: React.ReactElement, initialState = {}) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('WorkloadTeamView', () => {
  const mockTeam = {
    id: 'team-1',
    name: 'Development Team',
    description: 'Frontend and backend developers',
    members: ['user-1', 'user-2'],
    createdAt: '2024-01-01T00:00:00.000Z'
  };

  const mockWorkloadData = {
    teamId: 'team-1',
    totalHours: 120,
    memberWorkloads: [
      {
        userId: 'user-1',
        userName: 'John Doe',
        totalHours: 80,
        tasks: [
          {
            id: 'task-1',
            title: 'Frontend Development',
            estimatedHours: 40,
            startDate: '2024-01-01',
            endDate: '2024-01-05'
          }
        ]
      },
      {
        userId: 'user-2',
        userName: 'Jane Smith',
        totalHours: 40,
        tasks: [
          {
            id: 'task-2',
            title: 'Backend Development',
            estimatedHours: 40,
            startDate: '2024-01-06',
            endDate: '2024-01-10'
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWorkloadService.getTeamWorkload.mockResolvedValue(mockWorkloadData);
  });

  it('renders workload team view with team data', async () => {
    renderWithProviders(
      <WorkloadTeamView teamId="team-1" />,
      { teams: [mockTeam], selectedTeam: mockTeam }
    );

    expect(screen.getByText('Team Workload')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Development Team')).toBeInTheDocument();
    });
  });

  it('displays workload chart', async () => {
    renderWithProviders(
      <WorkloadTeamView teamId="team-1" />,
      { teams: [mockTeam], selectedTeam: mockTeam }
    );

    await waitFor(() => {
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('shows member workload details', async () => {
    renderWithProviders(
      <WorkloadTeamView teamId="team-1" />,
      { teams: [mockTeam], selectedTeam: mockTeam }
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('80h')).toBeInTheDocument();
      expect(screen.getByText('40h')).toBeInTheDocument();
    });
  });

  it('handles date range selection', async () => {
    renderWithProviders(
      <WorkloadTeamView teamId="team-1" />,
      { teams: [mockTeam], selectedTeam: mockTeam }
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockWorkloadService.getTeamWorkload).toHaveBeenCalledWith(
        'team-1',
        expect.any(String),
        expect.any(String)
      );
    });

    // Change date range
    const startDateInput = screen.getByLabelText(/start date/i);
    fireEvent.change(startDateInput, { target: { value: '2024-02-01' } });

    const endDateInput = screen.getByLabelText(/end date/i);
    fireEvent.change(endDateInput, { target: { value: '2024-02-28' } });

    await waitFor(() => {
      expect(mockWorkloadService.getTeamWorkload).toHaveBeenCalledWith(
        'team-1',
        '2024-02-01',
        '2024-02-28'
      );
    });
  });

  it('displays loading state', () => {
    mockWorkloadService.getTeamWorkload.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(
      <WorkloadTeamView teamId="team-1" />,
      { teams: [mockTeam], selectedTeam: mockTeam }
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    const errorMessage = 'Failed to load workload data';
    mockWorkloadService.getTeamWorkload.mockRejectedValue(new Error(errorMessage));

    renderWithProviders(
      <WorkloadTeamView teamId="team-1" />,
      { teams: [mockTeam], selectedTeam: mockTeam }
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading workload data/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no workload data', async () => {
    mockWorkloadService.getTeamWorkload.mockResolvedValue({
      teamId: 'team-1',
      totalHours: 0,
      memberWorkloads: []
    });

    renderWithProviders(
      <WorkloadTeamView teamId="team-1" />,
      { teams: [mockTeam], selectedTeam: mockTeam }
    );

    await waitFor(() => {
      expect(screen.getByText(/no workload data available/i)).toBeInTheDocument();
    });
  });

  it('allows filtering by team member', async () => {
    renderWithProviders(
      <WorkloadTeamView teamId="team-1" />,
      { teams: [mockTeam], selectedTeam: mockTeam }
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on member filter
    const memberFilter = screen.getByText('John Doe');
    fireEvent.click(memberFilter);

    // Should show only John's tasks
    await waitFor(() => {
      expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    });
  });
});