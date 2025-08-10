import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Timeline as GanttIcon } from '@mui/icons-material';

export const GanttView: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <GanttIcon />
        <Typography variant="h4" component="h1">
          Gantt Chart
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Project Timeline
          </Typography>
          <Typography color="text.secondary">
            Interactive Gantt chart showing project timelines, task dependencies, 
            and multi-project views will be implemented here.
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2">
              Features to implement:
            </Typography>
            <ul>
              <li>Task timeline visualization</li>
              <li>Dependency management</li>
              <li>Multi-project view</li>
              <li>Drag-and-drop timeline editing</li>
              <li>Resource allocation overlay</li>
            </ul>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};