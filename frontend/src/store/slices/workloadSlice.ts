import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { WorkloadSummary } from '@task-manager/shared';
import { apiClient } from '../../services/apiClient';

interface WorkloadState {
  summary: WorkloadSummary | null;
  teamWorkload: WorkloadSummary[];
  distribution: any;
  entries: any[];
  dailyWorkload: { [userId: string]: { [date: string]: number } };
  loading: boolean;
  error: string | null;
}

const initialState: WorkloadState = {
  summary: null,
  teamWorkload: [],
  distribution: null,
  entries: [],
  dailyWorkload: {},
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
  async ({ startDate, endDate, userId }: { startDate: string; endDate: string; userId?: string }) => {
    const params: any = { startDate, endDate };
    if (userId) {
      params.userId = userId;
    }
    
    console.log('Fetching workload entries with params:', params);
    
    const response = await apiClient.get('/workload/entries', { params });
    return response.data.entries;
  }
);

export const fetchTeamDailyWorkload = createAsyncThunk(
  'workload/fetchTeamDailyWorkload',
  async ({ projectId, startDate, endDate }: { 
    projectId: string; 
    startDate: string; 
    endDate: string; 
  }, { rejectWithValue }) => {
    try {
      console.log('Fetching team daily workload:', { projectId, startDate, endDate });
      
      const response = await apiClient.get('/workload/team/daily', {
        params: { projectId, startDate, endDate },
        timeout: 15000 // 15 second timeout for this specific request
      });
      
      console.log('Team daily workload response:', response.data);
      return response.data.dailyWorkload;
    } catch (error: any) {
      console.error('Error fetching team daily workload:', error);
      
      if (error.code === 'ECONNABORTED') {
        return rejectWithValue('Request timeout - please try again');
      }
      
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch team daily workload'
      );
    }
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
        console.log('Workload entries fetched:', action.payload);
        state.entries = action.payload;
      })
      .addCase(fetchWorkloadEntries.rejected, (state, action) => {
        console.error('Failed to fetch workload entries:', action.error);
        state.error = action.error.message || 'Failed to fetch workload entries';
      })
      .addCase(fetchTeamDailyWorkload.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamDailyWorkload.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyWorkload = action.payload;
        state.error = null;
      })
      .addCase(fetchTeamDailyWorkload.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || action.error.message || 'Failed to fetch daily workload';
      });
  },
});

export const { clearError } = workloadSlice.actions;
export default workloadSlice.reducer;