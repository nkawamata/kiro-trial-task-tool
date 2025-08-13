import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { WorkloadSummary } from '@task-manager/shared';

interface WorkloadInsightsProps {
  summary: WorkloadSummary | null;
  distribution: any;
  teamWorkload: WorkloadSummary[];
}

interface Insight {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action?: string;
}

export const WorkloadInsights: React.FC<WorkloadInsightsProps> = ({
  summary,
  distribution,
  teamWorkload,
}) => {
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // Capacity analysis
    if (distribution) {
      const utilizationRate = (distribution.allocated / distribution.totalCapacity) * 100;
      
      if (utilizationRate > 90) {
        insights.push({
          type: 'warning',
          title: 'Over Capacity',
          description: `You're at ${utilizationRate.toFixed(0)}% capacity utilization. Consider redistributing work or extending deadlines.`,
          action: 'Review project priorities and deadlines'
        });
      } else if (utilizationRate < 50) {
        insights.push({
          type: 'info',
          title: 'Under Utilized',
          description: `You're only at ${utilizationRate.toFixed(0)}% capacity. You could take on additional work.`,
          action: 'Consider picking up additional tasks'
        });
      } else {
        insights.push({
          type: 'success',
          title: 'Optimal Capacity',
          description: `You're at ${utilizationRate.toFixed(0)}% capacity utilization - a healthy workload balance.`,
        });
      }
    }

    // Project efficiency analysis
    if (summary && summary.projects.length > 0) {
      const overAllocatedProjects = summary.projects.filter(p => 
        p.actualHours > p.allocatedHours * 1.2
      );
      
      const underAllocatedProjects = summary.projects.filter(p => 
        p.actualHours < p.allocatedHours * 0.8 && p.allocatedHours > 0
      );

      if (overAllocatedProjects.length > 0) {
        insights.push({
          type: 'warning',
          title: 'Projects Over Budget',
          description: `${overAllocatedProjects.length} project(s) are significantly over their allocated hours.`,
          action: 'Review project scope and time estimates'
        });
      }

      if (underAllocatedProjects.length > 0) {
        insights.push({
          type: 'info',
          title: 'Projects Under Budget',
          description: `${underAllocatedProjects.length} project(s) are using fewer hours than allocated.`,
          action: 'Consider reallocating time to other projects'
        });
      }

      // Overall efficiency
      const overallEfficiency = (summary.totalActualHours / summary.totalAllocatedHours) * 100;
      if (overallEfficiency > 110) {
        insights.push({
          type: 'warning',
          title: 'Consistently Over Estimates',
          description: `Your actual hours are ${overallEfficiency.toFixed(0)}% of allocated. You may be underestimating tasks.`,
          action: 'Review estimation process and add buffer time'
        });
      } else if (overallEfficiency < 80) {
        insights.push({
          type: 'info',
          title: 'Consistently Under Estimates',
          description: `Your actual hours are ${overallEfficiency.toFixed(0)}% of allocated. You may be overestimating tasks.`,
          action: 'Consider more aggressive time estimates'
        });
      }
    }

    // Team workload analysis
    if (teamWorkload.length > 0) {
      const overloadedMembers = teamWorkload.filter(member => {
        const utilization = member.totalAllocatedHours > 0 
          ? (member.totalActualHours / member.totalAllocatedHours) * 100 
          : 0;
        return utilization > 120;
      });

      const underutilizedMembers = teamWorkload.filter(member => {
        const utilization = member.totalAllocatedHours > 0 
          ? (member.totalActualHours / member.totalAllocatedHours) * 100 
          : 0;
        return utilization < 60 && member.totalAllocatedHours > 0;
      });

      if (overloadedMembers.length > 0) {
        insights.push({
          type: 'warning',
          title: 'Team Members Overloaded',
          description: `${overloadedMembers.length} team member(s) are working significantly over capacity.`,
          action: 'Redistribute workload or provide additional resources'
        });
      }

      if (underutilizedMembers.length > 0) {
        insights.push({
          type: 'info',
          title: 'Team Capacity Available',
          description: `${underutilizedMembers.length} team member(s) have additional capacity available.`,
          action: 'Consider assigning additional tasks'
        });
      }
    }

    return insights;
  };

  const insights = generateInsights();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      case 'success':
        return <CheckCircleIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  };

  const formatHours = (hours: number) => `${hours.toFixed(1)}h`;

  return (
    <Grid container spacing={3}>
      {/* Key Insights */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Workload Insights & Recommendations
            </Typography>
            
            {insights.length > 0 ? (
              <List>
                {insights.map((insight, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getInsightIcon(insight.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {insight.title}
                          </Typography>
                          <Chip
                            label={insight.type}
                            color={getInsightColor(insight.type) as any}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {insight.description}
                          </Typography>
                          {insight.action && (
                            <Alert severity={insight.type as any} sx={{ mt: 1 }}>
                              <strong>Recommended Action:</strong> {insight.action}
                            </Alert>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                No specific insights available. Your workload appears to be well balanced.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Stats */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  This Week
                </Typography>
              </Box>
              {distribution && (
                <Box>
                  <Typography variant="h5" color="primary.main">
                    {formatHours(distribution.allocated)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    of {formatHours(distribution.totalCapacity)} allocated
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Efficiency Trend
                </Typography>
              </Box>
              {summary && (
                <Box>
                  <Typography variant="h5" color="secondary.main">
                    {summary.totalAllocatedHours > 0 
                      ? `${((summary.totalActualHours / summary.totalAllocatedHours) * 100).toFixed(0)}%`
                      : '0%'
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    actual vs allocated
                  </Typography>
                </Box>
              )}
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDownIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Available Capacity
                </Typography>
              </Box>
              {distribution && (
                <Box>
                  <Typography variant="h5" color="success.main">
                    {formatHours(distribution.available)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    remaining this week
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};