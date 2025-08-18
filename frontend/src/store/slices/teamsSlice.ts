import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Team, TeamRole } from '@task-manager/shared';
import { teamsService, TeamWithRole, TeamMemberWithUser, ProjectTeamWithTeam } from '../../services/teamsService';

interface TeamsState {
  // User's teams
  userTeams: TeamWithRole[];
  userTeamsLoading: boolean;
  userTeamsError: string | null;

  // Current team details
  currentTeam: Team | null;
  currentTeamRole: TeamRole | null;
  currentTeamLoading: boolean;
  currentTeamError: string | null;

  // Team members by team ID
  teamMembers: Record<string, TeamMemberWithUser[]>;
  teamMembersLoading: Record<string, boolean>;
  teamMembersError: Record<string, string | null>;

  // Project teams by project ID
  projectTeams: Record<string, ProjectTeamWithTeam[]>;
  projectTeamsLoading: Record<string, boolean>;
  projectTeamsError: Record<string, string | null>;

  // Search results
  searchResults: Team[];
  searchLoading: boolean;
  searchError: string | null;
}

const initialState: TeamsState = {
  userTeams: [],
  userTeamsLoading: false,
  userTeamsError: null,

  currentTeam: null,
  currentTeamRole: null,
  currentTeamLoading: false,
  currentTeamError: null,

  teamMembers: {},
  teamMembersLoading: {},
  teamMembersError: {},

  projectTeams: {},
  projectTeamsLoading: {},
  projectTeamsError: {},

  searchResults: [],
  searchLoading: false,
  searchError: null,
};

// Async thunks
export const fetchUserTeams = createAsyncThunk(
  'teams/fetchUserTeams',
  async () => {
    return await teamsService.getUserTeams();
  }
);

export const createTeam = createAsyncThunk(
  'teams/createTeam',
  async (data: { name: string; description?: string }) => {
    return await teamsService.createTeam(data);
  }
);

export const fetchTeam = createAsyncThunk(
  'teams/fetchTeam',
  async (teamId: string) => {
    return await teamsService.getTeam(teamId);
  }
);

export const updateTeam = createAsyncThunk(
  'teams/updateTeam',
  async (data: { teamId: string; name?: string; description?: string }) => {
    const { teamId, ...updateData } = data;
    return await teamsService.updateTeam(teamId, updateData);
  }
);

export const deleteTeam = createAsyncThunk(
  'teams/deleteTeam',
  async (teamId: string) => {
    await teamsService.deleteTeam(teamId);
    return teamId;
  }
);

export const fetchTeamMembers = createAsyncThunk(
  'teams/fetchTeamMembers',
  async (teamId: string) => {
    const members = await teamsService.getTeamMembers(teamId);
    return { teamId, members };
  }
);

export const addTeamMember = createAsyncThunk(
  'teams/addTeamMember',
  async (data: { teamId: string; userId: string; role: TeamRole }) => {
    const { teamId, ...memberData } = data;
    await teamsService.addTeamMember(teamId, memberData);
    return data;
  }
);

export const removeTeamMember = createAsyncThunk(
  'teams/removeTeamMember',
  async (data: { teamId: string; userId: string }) => {
    await teamsService.removeTeamMember(data.teamId, data.userId);
    return data;
  }
);

export const updateTeamMemberRole = createAsyncThunk(
  'teams/updateTeamMemberRole',
  async (data: { teamId: string; userId: string; role: TeamRole }) => {
    const { teamId, userId, role } = data;
    await teamsService.updateTeamMemberRole(teamId, userId, { role });
    return data;
  }
);

export const fetchProjectTeams = createAsyncThunk(
  'teams/fetchProjectTeams',
  async (projectId: string) => {
    const projectTeams = await teamsService.getProjectTeams(projectId);
    return { projectId, projectTeams };
  }
);

export const addTeamToProject = createAsyncThunk(
  'teams/addTeamToProject',
  async (data: { teamId: string; projectId: string }) => {
    await teamsService.addTeamToProject(data.teamId, data.projectId);
    return data;
  }
);

export const removeTeamFromProject = createAsyncThunk(
  'teams/removeTeamFromProject',
  async (data: { teamId: string; projectId: string }) => {
    await teamsService.removeTeamFromProject(data.teamId, data.projectId);
    return data;
  }
);

export const searchTeams = createAsyncThunk(
  'teams/searchTeams',
  async (query: string) => {
    return await teamsService.searchTeams(query);
  }
);

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    clearCurrentTeam: (state) => {
      state.currentTeam = null;
      state.currentTeamRole = null;
      state.currentTeamError = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch user teams
    builder
      .addCase(fetchUserTeams.pending, (state) => {
        state.userTeamsLoading = true;
        state.userTeamsError = null;
      })
      .addCase(fetchUserTeams.fulfilled, (state, action) => {
        state.userTeamsLoading = false;
        state.userTeams = action.payload;
      })
      .addCase(fetchUserTeams.rejected, (state, action) => {
        state.userTeamsLoading = false;
        state.userTeamsError = action.error.message || 'Failed to fetch teams';
      });

    // Create team
    builder
      .addCase(createTeam.fulfilled, (state, action) => {
        // Add the new team to user teams with owner role
        state.userTeams.push({ ...action.payload, role: TeamRole.OWNER });
      });

    // Fetch team
    builder
      .addCase(fetchTeam.pending, (state) => {
        state.currentTeamLoading = true;
        state.currentTeamError = null;
      })
      .addCase(fetchTeam.fulfilled, (state, action) => {
        state.currentTeamLoading = false;
        state.currentTeam = action.payload.team;
        state.currentTeamRole = action.payload.userRole;
      })
      .addCase(fetchTeam.rejected, (state, action) => {
        state.currentTeamLoading = false;
        state.currentTeamError = action.error.message || 'Failed to fetch team';
      });

    // Update team
    builder
      .addCase(updateTeam.fulfilled, (state, action) => {
        if (state.currentTeam && state.currentTeam.id === action.payload.id) {
          state.currentTeam = action.payload;
        }
        // Update in user teams list
        const index = state.userTeams.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.userTeams[index] = { ...state.userTeams[index], ...action.payload };
        }
      });

    // Delete team
    builder
      .addCase(deleteTeam.fulfilled, (state, action) => {
        const teamId = action.payload;
        state.userTeams = state.userTeams.filter(t => t.id !== teamId);
        if (state.currentTeam && state.currentTeam.id === teamId) {
          state.currentTeam = null;
          state.currentTeamRole = null;
        }
        delete state.teamMembers[teamId];
        delete state.teamMembersLoading[teamId];
        delete state.teamMembersError[teamId];
      });

    // Fetch team members
    builder
      .addCase(fetchTeamMembers.pending, (state, action) => {
        const teamId = action.meta.arg;
        state.teamMembersLoading[teamId] = true;
        state.teamMembersError[teamId] = null;
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        const { teamId, members } = action.payload;
        state.teamMembersLoading[teamId] = false;
        state.teamMembers[teamId] = members;
      })
      .addCase(fetchTeamMembers.rejected, (state, action) => {
        const teamId = action.meta.arg;
        state.teamMembersLoading[teamId] = false;
        state.teamMembersError[teamId] = action.error.message || 'Failed to fetch team members';
      });

    // Add team member
    builder
      .addCase(addTeamMember.fulfilled, (state, action) => {
        // Refresh will be handled by component
      });

    // Remove team member
    builder
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        const { teamId, userId } = action.payload;
        if (state.teamMembers[teamId]) {
          state.teamMembers[teamId] = state.teamMembers[teamId].filter(m => m.userId !== userId);
        }
      });

    // Update team member role
    builder
      .addCase(updateTeamMemberRole.fulfilled, (state, action) => {
        const { teamId, userId, role } = action.payload;
        if (state.teamMembers[teamId]) {
          const member = state.teamMembers[teamId].find(m => m.userId === userId);
          if (member) {
            member.role = role;
          }
        }
      });

    // Fetch project teams
    builder
      .addCase(fetchProjectTeams.pending, (state, action) => {
        const projectId = action.meta.arg;
        state.projectTeamsLoading[projectId] = true;
        state.projectTeamsError[projectId] = null;
      })
      .addCase(fetchProjectTeams.fulfilled, (state, action) => {
        const { projectId, projectTeams } = action.payload;
        state.projectTeamsLoading[projectId] = false;
        state.projectTeams[projectId] = projectTeams;
      })
      .addCase(fetchProjectTeams.rejected, (state, action) => {
        const projectId = action.meta.arg;
        state.projectTeamsLoading[projectId] = false;
        state.projectTeamsError[projectId] = action.error.message || 'Failed to fetch project teams';
      });

    // Add team to project
    builder
      .addCase(addTeamToProject.fulfilled, (state, action) => {
        // Refresh will be handled by component
      });

    // Remove team from project
    builder
      .addCase(removeTeamFromProject.fulfilled, (state, action) => {
        const { teamId, projectId } = action.payload;
        if (state.projectTeams[projectId]) {
          state.projectTeams[projectId] = state.projectTeams[projectId].filter(pt => pt.teamId !== teamId);
        }
      });

    // Search teams
    builder
      .addCase(searchTeams.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchTeams.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchTeams.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.error.message || 'Failed to search teams';
      });
  },
});

export const { clearCurrentTeam, clearSearchResults } = teamsSlice.actions;
export default teamsSlice.reducer;