import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Task } from '@task-manager/shared';
import { apiClient } from '../../services/apiClient';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  loading: false,
  error: null,
};

export const fetchProjectTasks = createAsyncThunk(
  'tasks/fetchProjectTasks',
  async (projectId: string) => {
    const response = await apiClient.get(`/tasks/project/${projectId}`);
    return response.data.tasks;
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Partial<Task>) => {
    const response = await apiClient.post('/tasks', taskData);
    return response.data.task;
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
    const response = await apiClient.put(`/tasks/${id}`, updates);
    return response.data.task;
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string) => {
    await apiClient.delete(`/tasks/${taskId}`);
    return taskId;
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjectTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchProjectTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t.id !== action.payload);
      });
  },
});

export const { clearError } = tasksSlice.actions;
export default tasksSlice.reducer;