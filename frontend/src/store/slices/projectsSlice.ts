import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Project } from '@task-manager/shared';
import { apiClient } from '../../services/apiClient';

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk('projects/fetchProjects', async () => {
  const response = await apiClient.get('/projects');
  return response.data.projects;
});

export const fetchProject = createAsyncThunk(
  'projects/fetchProject',
  async (projectId: string) => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data.project;
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData: Partial<Project>) => {
    const response = await apiClient.post('/projects', projectData);
    return response.data.project;
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
    const response = await apiClient.put(`/projects/${id}`, updates);
    return response.data.project;
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId: string) => {
    await apiClient.delete(`/projects/${projectId}`);
    return projectId;
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch projects';
      })
      .addCase(fetchProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.loading = false;
        // Add or update the project in the array
        const existingIndex = state.projects.findIndex(p => p.id === action.payload.id);
        if (existingIndex !== -1) {
          state.projects[existingIndex] = action.payload;
        } else {
          state.projects.push(action.payload);
        }
        state.currentProject = action.payload;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch project';
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.push(action.payload);
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload);
      });
  },
});

export const { setCurrentProject, clearError } = projectsSlice.actions;
export default projectsSlice.reducer;