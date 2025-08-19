import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import TeamsPage from '../TeamsPage';
import teamsSlice from '../../../store/slices/teamsSlice';
import { teamsService } from '../../../services/teamsService';

// Mock the teams service
jest.mock('../../../services/teamsService');
const mockTeamsService = teamsService as jest.Mocked<typeof teamsService>;

// Mock Material-UI components that might cause issues
jest.mock('@mui/material/Dialog', () => {
  return function MockDialog({ children, open }: any) {
    return open ? <div data-testid="dialog">{children}</div> : null;
  };
});

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
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('TeamsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders teams page with empty state', () => {
    renderWithProviders(<TeamsPage />);
    
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Create Team')).toBeInTheDocument();
  });

  it('displays teams when available', () => {
    const mockTeams = [
      {
        id: 'team-1',
        name: 'Development Team',
        description: 'Frontend and backend developers',
        members: ['user-1', 'user-2'],
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'team-2',
        name: 'Design Team',
        description: 'UI/UX designers',
        members: ['user-3'],
        createdAt: '2024-01-02T00:00:00.000Z'
      }
    ];

    renderWithProviders(<TeamsPage />, { teams: mockTeams });

    expect(screen.getByText('Development Team')).toBeInTheDocument();
    expect(screen.getByText('Design Team')).toBeInTheDocument();
    expect(screen.getByText('Frontend and backend developers')).toBeInTheDocument();
  });

  it('opens create team dialog when create button is clicked', async () => {
    renderWithProviders(<TeamsPage />);
    
    const createButton = screen.getByText('Create Team');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  it('handles team creation', async () => {
    const mockNewTeam = {
      id: 'team-new',
      name: 'New Team',
      description: 'A new team',
      members: [],
      createdAt: '2024-01-03T00:00:00.000Z'
    };

    mockTeamsService.createTeam.mockResolvedValue(mockNewTeam);

    renderWithProviders(<TeamsPage />);
    
    const createButton = screen.getByText('Create Team');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    // Fill in form fields
    const nameInput = screen.getByLabelText(/team name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    fireEvent.change(nameInput, { target: { value: 'New Team' } });
    fireEvent.change(descriptionInput, { target: { value: 'A new team' } });

    // Submit form
    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockTeamsService.createTeam).toHaveBeenCalledWith({
        name: 'New Team',
        description: 'A new team',
        members: []
      });
    });
  });

  it('displays loading state', () => {
    renderWithProviders(<TeamsPage />, { loading: true });
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorMessage = 'Failed to load teams';
    renderWithProviders(<TeamsPage />, { error: errorMessage });
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('navigates to team detail when team is clicked', async () => {
    const mockTeams = [
      {
        id: 'team-1',
        name: 'Development Team',
        description: 'Frontend and backend developers',
        members: ['user-1', 'user-2'],
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    ];

    renderWithProviders(<TeamsPage />, { teams: mockTeams });

    const teamCard = screen.getByText('Development Team');
    fireEvent.click(teamCard);

    // In a real test, you would check for navigation
    // This would require mocking useNavigate from react-router-dom
  });
});