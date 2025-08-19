import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useDashboardStats } from '../useDashboardStats';
import projectsSlice from '../../store/slices/projectsSlice';
import tasksSlice from '../../store/slices/tasksSlice';

// Mock the services
jest.mock('../../services/taskService', () => ({
  taskService: {
    getAllTasks: jest.fn().mockResolvedValue([
      { id: '1', title: 'Task 1', status: 'todo', projectId: 'project-1' },
      { id: '2', title: 'Task 2', status: 'in-progress', projectId: 'project-1' },
      { id: '3', title: 'Task 3', status: 'completed', projectId: 'project-2' }
    ])
  }
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      projects: projectsSlice,
      tasks: tasksSlice
    },
    preloadedState: {
      projects: {
        projects: [
          { id: 'project-1', name: 'Project 1', status: 'active' },
          { id: 'project-2', name: 'Project 2', status: 'completed' }
        ],
        selectedProject: null,
        loading: false,
        error: null,
        ...initialState.projects
      },
      tasks: {
        tasks: [],
        selectedTask: null,
        loading: false,
        error: null,
        ...initialState.tasks
      }
    }
  });
};

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const store = createMockStore();
  return <Provider store={store}>{children}</Provider>;
};

describe('useDashboardStats', () => {
  it('should return initial stats', () => {
    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    expect(result.current.totalProjects).toBe(2);
    expect(result.current.activeProjects).toBe(1);
    expect(result.current.completedProjects).toBe(1);
    expect(result.current.totalTasks).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('should calculate task statistics correctly', async () => {
    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.totalTasks).toBeGreaterThan(0);
    });

    expect(result.current.todoTasks).toBeDefined();
    expect(result.current.inProgressTasks).toBeDefined();
    expect(result.current.completedTasks).toBeDefined();
  });

  it('should handle loading state', () => {
    const storeWithLoading = createMockStore({
      projects: { loading: true },
      tasks: { loading: true }
    });

    const wrapperWithLoading = ({ children }: { children: React.ReactNode }) => (
      <Provider store={storeWithLoading}>{children}</Provider>
    );

    const { result } = renderHook(() => useDashboardStats(), { wrapper: wrapperWithLoading });

    expect(result.current.loading).toBe(true);
  });

  it('should handle empty state', () => {
    const storeWithEmptyData = createMockStore({
      projects: { projects: [] },
      tasks: { tasks: [] }
    });

    const wrapperWithEmptyData = ({ children }: { children: React.ReactNode }) => (
      <Provider store={storeWithEmptyData}>{children}</Provider>
    );

    const { result } = renderHook(() => useDashboardStats(), { wrapper: wrapperWithEmptyData });

    expect(result.current.totalProjects).toBe(0);
    expect(result.current.activeProjects).toBe(0);
    expect(result.current.completedProjects).toBe(0);
    expect(result.current.totalTasks).toBe(0);
  });
});