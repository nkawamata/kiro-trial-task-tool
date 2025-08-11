import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Assignment as TaskIcon, Add as AddIcon } from '@mui/icons-material';

export const TaskManagement: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateTask = () => {
    navigate('/tasks/create');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TaskIcon />
          <Typography variant="h4" component="h1">
            Task Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTask}
          sx={{ minWidth: 140 }}
        >
          Create Task
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Tasks
          </Typography>
          <Typography color="text.secondary">
            Task management interface will be implemented here.
            This will show tasks across all projects with filtering and sorting options.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};