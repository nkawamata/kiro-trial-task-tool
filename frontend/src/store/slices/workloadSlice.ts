import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { WorkloadSummary } from '@task-manager/shared';
import { apiClient } from '../../services/apiClient';

interface WorkloadState {
  summary: WorkloadSummary | null;
  teamWorkload: WorkloadSummary[];
  distribution: any;
  entries: any[];
  loading: boolean;
  error: string | null;
}

const initialState: WorkloadState = {
  summary: null,
  teamWorkload: [],
  distribution: null,
  entries: [],
  loading: false,
  error: null,
};

export const fetchWorkloadSummary = createAsyncThunk(
  'workload/fetchSummary',
  async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    const response = await apiClient.get('/workload/summary', {
      params: { startDate, endDate }
    });
    return response.data.summary;
  }
);

export const fetchTeamWorkload = createAsyncThunk(
  'workload/fetchTeamWorkload',
  async ({ projectId, startDate, endDate }: { 
    projectId: string; 
    startDate: string; 
    endDate: string; 
  }) => {
    const response = await apiClient.get('/workload/team', {
      params: { projectId, startDate, endDate }
    });
    return response.data.workload;
  }
);

export const fetchWorkloadDistribution = createAsyncThunk(
  'workload/fetchDistribution',
  async () => {
    const response = await apiClient.get('/workload/distribution');
    return response.data.distribution;
  }
);

export const fetchWorkloadEntries = createAsyncThunk(
  'workload/fetchEntries',
  async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    const response = await apiClient.get('/workload/entries', {
      params: { startDate, endDate }
    });
    return response.data.entries;
  }
);

const workloadSlice = createSlice({
  name: 'workload',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkloadSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkloadSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchWorkloadSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch workload summary';
      })
      .addCase(fetchTeamWorkload.fulfilled, (state, action) => {
        state.teamWorkload = action.payload;
      })
      .addCase(fetchWorkloadDistribution.fulfilled, (state, action) => {
        state.distribution = action.payload;
      })
      .addCase(fetchWorkloadEntries.fulfilled, (state, action) => {
        state.entries = action.payload;
      });
  },
});

export const { clearError } = workloadSlice.actions;
export default workloadSlice.reducer;