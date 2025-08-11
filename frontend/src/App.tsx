import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './store';
import { setUser, clearUser } from './store/slices/authSlice';
import { useApiAuth } from './hooks/useApiAuth';

import { AuthWrapper } from './components/auth/AuthWrapper';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ProjectView } from './pages/ProjectView';
import { TaskManagement } from './pages/TaskManagement';
import { TaskCreatePage } from './pages/TaskCreatePage';
import { TaskEditPage } from './pages/TaskEditPage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { WorkloadView } from './pages/WorkloadView';
import { GanttView } from './pages/GanttView';
import { AuthCallback } from './components/auth/AuthCallback';

function App() {
  const auth = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  
  // Set up API authentication
  useApiAuth();

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      // Safely access user properties with fallbacks
      const userAny = auth.user as any;
      
      // Access user claims from the profile or directly from user object
      const userProfile = userAny.profile || userAny;
      
      dispatch(setUser({
        id: userProfile.sub || userAny.sub || 'unknown',
        email: userProfile.email || userProfile.preferred_username || userAny.email || '',
        name: userProfile.name || userProfile.given_name || userProfile.preferred_username || userAny.name || 'User',
        cognitoId: userProfile.sub || userAny.sub || 'unknown',
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } else {
      dispatch(clearUser());
    }
  }, [auth.isAuthenticated, auth.user, dispatch]);

  if (auth.isLoading) {
    return <AuthWrapper />;
  }

  if (!auth.isAuthenticated) {
    return <AuthWrapper />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/callback" element={<AuthCallback />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects/:projectId" element={<ProjectView />} />
        <Route path="/tasks" element={<TaskManagement />} />
        <Route path="/tasks/create" element={<TaskCreatePage />} />
        <Route path="/tasks/:taskId/edit" element={<TaskEditPage />} />
        <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="/workload" element={<WorkloadView />} />
        <Route path="/gantt" element={<GanttView />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;