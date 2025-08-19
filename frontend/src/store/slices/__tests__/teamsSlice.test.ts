import { configureStore } from '@reduxjs/toolkit';
import teamsSlice, {
  setTeams,
  setSelectedTeam,
  addTeam,
  updateTeam,
  removeTeam,
  setLoading,
  setError,
  clearError
} from '../teamsSlice';

describe('teamsSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        teams: teamsSlice
      }
    });
  });

  it('should have initial state', () => {
    const state = store.getState().teams;
    expect(state).toEqual({
      teams: [],
      selectedTeam: null,
      loading: false,
      error: null
    });
  });

  describe('setTeams', () => {
    it('should set teams', () => {
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

      store.dispatch(setTeams(mockTeams));

      const state = store.getState().teams;
      expect(state.teams).toEqual(mockTeams);
    });
  });

  describe('setSelectedTeam', () => {
    it('should set selected team', () => {
      const mockTeam = {
        id: 'team-1',
        name: 'Development Team',
        description: 'Frontend and backend developers',
        members: ['user-1', 'user-2'],
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      store.dispatch(setSelectedTeam(mockTeam));

      const state = store.getState().teams;
      expect(state.selectedTeam).toEqual(mockTeam);
    });

    it('should clear selected team when null is passed', () => {
      // First set a team
      const mockTeam = {
        id: 'team-1',
        name: 'Development Team',
        description: 'Frontend and backend developers',
        members: ['user-1'],
        createdAt: '2024-01-01T00:00:00.000Z'
      };
      store.dispatch(setSelectedTeam(mockTeam));

      // Then clear it
      store.dispatch(setSelectedTeam(null));

      const state = store.getState().teams;
      expect(state.selectedTeam).toBeNull();
    });
  });

  describe('addTeam', () => {
    it('should add new team to the list', () => {
      const existingTeam = {
        id: 'team-1',
        name: 'Existing Team',
        description: 'An existing team',
        members: ['user-1'],
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const newTeam = {
        id: 'team-2',
        name: 'New Team',
        description: 'A new team',
        members: ['user-2'],
        createdAt: '2024-01-02T00:00:00.000Z'
      };

      store.dispatch(setTeams([existingTeam]));
      store.dispatch(addTeam(newTeam));

      const state = store.getState().teams;
      expect(state.teams).toHaveLength(2);
      expect(state.teams).toContain(existingTeam);
      expect(state.teams).toContain(newTeam);
    });
  });

  describe('updateTeam', () => {
    it('should update existing team', () => {
      const originalTeam = {
        id: 'team-1',
        name: 'Original Team',
        description: 'Original description',
        members: ['user-1'],
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const updatedTeam = {
        ...originalTeam,
        name: 'Updated Team',
        description: 'Updated description',
        updatedAt: '2024-01-02T00:00:00.000Z'
      };

      store.dispatch(setTeams([originalTeam]));
      store.dispatch(updateTeam(updatedTeam));

      const state = store.getState().teams;
      expect(state.teams).toHaveLength(1);
      expect(state.teams[0]).toEqual(updatedTeam);
    });

    it('should not update if team does not exist', () => {
      const existingTeam = {
        id: 'team-1',
        name: 'Existing Team',
        description: 'An existing team',
        members: ['user-1'],
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const nonExistentTeam = {
        id: 'team-999',
        name: 'Non-existent Team',
        description: 'This team does not exist',
        members: ['user-2'],
        createdAt: '2024-01-02T00:00:00.000Z'
      };

      store.dispatch(setTeams([existingTeam]));
      store.dispatch(updateTeam(nonExistentTeam));

      const state = store.getState().teams;
      expect(state.teams).toHaveLength(1);
      expect(state.teams[0]).toEqual(existingTeam);
    });
  });

  describe('removeTeam', () => {
    it('should remove team from the list', () => {
      const team1 = {
        id: 'team-1',
        name: 'Team 1',
        description: 'First team',
        members: ['user-1'],
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const team2 = {
        id: 'team-2',
        name: 'Team 2',
        description: 'Second team',
        members: ['user-2'],
        createdAt: '2024-01-02T00:00:00.000Z'
      };

      store.dispatch(setTeams([team1, team2]));
      store.dispatch(removeTeam('team-1'));

      const state = store.getState().teams;
      expect(state.teams).toHaveLength(1);
      expect(state.teams[0]).toEqual(team2);
    });

    it('should clear selected team if it was removed', () => {
      const team1 = {
        id: 'team-1',
        name: 'Team 1',
        description: 'First team',
        members: ['user-1'],
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      store.dispatch(setTeams([team1]));
      store.dispatch(setSelectedTeam(team1));
      store.dispatch(removeTeam('team-1'));

      const state = store.getState().teams;
      expect(state.teams).toHaveLength(0);
      expect(state.selectedTeam).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      store.dispatch(setLoading(true));

      const state = store.getState().teams;
      expect(state.loading).toBe(true);
    });

    it('should clear loading state', () => {
      store.dispatch(setLoading(true));
      store.dispatch(setLoading(false));

      const state = store.getState().teams;
      expect(state.loading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Something went wrong';
      store.dispatch(setError(errorMessage));

      const state = store.getState().teams;
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      store.dispatch(setError('Some error'));
      store.dispatch(clearError());

      const state = store.getState().teams;
      expect(state.error).toBeNull();
    });
  });
});