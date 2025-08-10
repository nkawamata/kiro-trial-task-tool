import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { WorkOutline as WorkloadIcon } from '@mui/icons-material';

export const WorkloadView: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <WorkloadIcon />
        <Typography variant="h4" component="h1">
          Workload Management
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Workload
              </Typography>
              <Typography color="text.secondary">
                Personal workload distribution across projects will be shown here.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Capacity
              </Typography>
              <Typography color="text.secondary">
                Team workload and capacity planning will be displayed here.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Distribution
              </Typography>
              <Typography color="text.secondary">
                Charts showing workload distribution across multiple projects will be implemented here.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};