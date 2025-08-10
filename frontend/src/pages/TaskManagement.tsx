import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Assignment as TaskIcon } from '@mui/icons-material';

export const TaskManagement: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <TaskIcon />
        <Typography variant="h4" component="h1">
          Task Management
        </Typography>
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