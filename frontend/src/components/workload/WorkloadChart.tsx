import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { WorkloadSummary } from '@task-manager/shared';

interface WorkloadChartProps {
  summary: WorkloadSummary | null;
  distribution: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const WorkloadChart: React.FC<WorkloadChartProps> = ({ summary, distribution }) => {
  const prepareBarChartData = () => {
    if (!summary) return [];
    
    return summary.projects.map((project) => ({
      name: project.projectName.length > 15 
        ? `${project.projectName.substring(0, 15)}...` 
        : project.projectName,
      allocated: project.allocatedHours,
      actual: project.actualHours,
      variance: project.actualHours - project.allocatedHours,
    }));
  };

  const preparePieChartData = () => {
    if (!distribution || !distribution.projects) return [];
    
    return distribution.projects.map((project: any, index: number) => ({
      name: project.name.length > 20 
        ? `${project.name.substring(0, 20)}...` 
        : project.name,
      value: project.hours,
      percentage: project.percentage,
      color: COLORS[index % COLORS.length],
    }));
  };

  const barChartData = prepareBarChartData();
  const pieChartData = preparePieChartData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {entry.name}: {entry.value.toFixed(1)}h
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {data.name}
          </Typography>
          <Typography variant="body2">
            Hours: {data.value.toFixed(1)}h
          </Typography>
          <Typography variant="body2">
            Percentage: {data.percentage.toFixed(1)}%
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (!summary && !distribution) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary" textAlign="center">
            No data available for charts
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={3}>
      {barChartData.length > 0 && (
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Allocated vs Actual Hours by Project
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="allocated" fill="#8884d8" name="Allocated" />
                  <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      )}

      {pieChartData.length > 0 && (
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Workload Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percentage }) => `${percentage.toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              <Box sx={{ mt: 2 }}>
                {pieChartData.map((entry: any, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: entry.color,
                        borderRadius: '50%',
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {entry.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {summary && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Efficiency Analysis
              </Typography>
              <Grid container spacing={2}>
                {summary.projects.map((project, index: number) => {
                  const efficiency = project.allocatedHours > 0 
                    ? (project.actualHours / project.allocatedHours) * 100 
                    : 0;
                  const variance = project.actualHours - project.allocatedHours;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={project.projectId}>
                      <Box
                        sx={{
                          p: 2,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          {project.projectName}
                        </Typography>
                        <Typography
                          variant="h5"
                          color={
                            efficiency > 100 ? 'error.main' :
                            efficiency > 90 ? 'warning.main' :
                            'success.main'
                          }
                        >
                          {efficiency.toFixed(0)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Efficiency
                        </Typography>
                        <Typography
                          variant="body2"
                          color={variance > 0 ? 'error.main' : 'success.main'}
                          sx={{ mt: 1 }}
                        >
                          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}h variance
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};