import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Tabs, Tab, Card, CardContent } from '@mui/material';
import { Folder as ProjectIcon } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store';
import { fetchProjectTasks } from '../store/slices/tasksSlice';
import { fetchProject } from '../store/slices/projectsSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, loading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  
  const [tabValue, setTabValue] = React.useState(0);
  
  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    if (projectId) {
      // If project is not in store, fetch it
      if (!project) {
        dispatch(fetchProject(projectId));
      }
      dispatch(fetchProjectTasks(projectId));
    }
  }, [dispatch, projectId, project]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (projectsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Loading project...</Typography>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Project not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <ProjectIcon />
        <Typography variant="h4" component="h1">
          {project.name}
        </Typography>
      </Box>

      {project.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {project.description}
        </Typography>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Tasks" />
          <Tab label="Timeline" />
          <Tab label="Team" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Project Tasks
            </Typography>
            {tasksLoading ? (
              <Typography>Loading tasks...</Typography>
            ) : tasks.length === 0 ? (
              <Typography color="text.secondary">
                No tasks in this project yet.
              </Typography>
            ) : (
              <Box>
                {tasks.map((task) => (
                  <Box key={task.id} sx={{ py: 2, borderBottom: '1px solid #eee' }}>
                    <Typography variant="subtitle1">{task.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {task.status} | Priority: {task.priority}
                    </Typography>
                    {task.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {task.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6">Timeline View</Typography>
            <Typography color="text.secondary">
              Gantt chart will be implemented here
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6">Team Members</Typography>
            <Typography color="text.secondary">
              Team management will be implemented here
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Project Settings</Typography>
            <Typography color="text.secondary">
              Project settings will be implemented here
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};