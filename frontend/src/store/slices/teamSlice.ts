import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ProjectMember, ProjectRole, User } from '@task-manager/shared';
import { teamService, ProjectMemberWithUser } from '../../services/teamService';

interface TeamState {
  members: Record<string, ProjectMemberWithUser[]>; // projectId -> members
  loading: boolean;
  error: string | null;
}

const initialState: TeamState = {
  members: {},
  loading: false,
  error: null,
};

// Async thunks
export const fetchProjectMembers = createAsyncThunk(
  'team/fetchProjectMembers',
  async (projectId: string) => {
    const members = await teamService.getProjectMembers(projectId);
    return { projectId, members };
  }
);

export const addProjectMember = createAsyncThunk(
  'team/addProjectMember',
  async ({ projectId, userId, role }: { projectId: string; userId: string; role: ProjectRole }) => {
    const member = await teamService.addProjectMember(projectId, { userId, role });
    return { projectId, member };
  }
);

export const removeProjectMember = createAsyncThunk(
  'team/removeProjectMember',
  async ({ projectId, userId }: { projectId: string; userId: string }) => {
    await teamService.removeProjectMember(projectId, userId);
    return { projectId, userId };
  }
);

export const updateMemberRole = createAsyncThunk(
  'team/updateMemberRole',
  async ({ projectId, userId, role }: { projectId: string; userId: string; role: ProjectRole }) => {
    const member = await teamService.updateMemberRole(projectId, userId, { role });
    return { projectId, userId, member };
  }
);

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearProjectMembers: (state, action: PayloadAction<string>) => {
      delete state.members[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch project members
      .addCase(fetchProjectMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members[action.payload.projectId] = action.payload.members;
      })
      .addCase(fetchProjectMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch project members';
      })
      
      // Add project member
      .addCase(addProjectMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProjectMember.fulfilled, (state, action) => {
        state.loading = false;
        // Refresh members for this project
        // Note: In a real app, you might want to optimistically update the state
      })
      .addCase(addProjectMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add project member';
      })
      
      // Remove project member
      .addCase(removeProjectMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeProjectMember.fulfilled, (state, action) => {
        state.loading = false;
        const { projectId, userId } = action.payload;
        if (state.members[projectId]) {
          state.members[projectId] = state.members[projectId].filter(
            member => member.userId !== userId
          );
        }
      })
      .addCase(removeProjectMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to remove project member';
      })
      
      // Update member role
      .addCase(updateMemberRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        state.loading = false;
        const { projectId, userId, member } = action.payload;
        if (state.members[projectId]) {
          const memberIndex = state.members[projectId].findIndex(m => m.userId === userId);
          if (memberIndex !== -1) {
            state.members[projectId][memberIndex] = { ...state.members[projectId][memberIndex], ...member };
          }
        }
      })
      .addCase(updateMemberRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update member role';
      });
  },
});

export const { clearError, clearProjectMembers } = teamSlice.actions;
export default teamSlice.reducer;