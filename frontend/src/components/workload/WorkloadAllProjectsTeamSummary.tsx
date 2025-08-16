import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate } from 'date-fns';
import { WorkloadSummary } from '@task-manager/shared';
import { WorkloadDayAllocationDialog } from './WorkloadDayAllocationDialog';

interface WorkloadAllProjectsTeamSummaryProps {
  teamSummary: WorkloadSummary[];
  dailyWorkload: { [userId: string]: { [date: string]: number } };
  loading?: boolean;
}

export const WorkloadAllProjectsTeamSummary: React.FC<WorkloadAllProjectsTeamSummaryProps> = ({
  teamSummary,
  dailyWorkload,
  loading = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Memoize current month dates
  const currentDate = new Date();
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getWorkloadColor = (hours: number) => {
    if (hours === 0) return 'default';
    if (hours <= 4) return 'success';
    if (hours <= 6) return 'info';
    if (hours <= 8) return 'warning';
    return 'error';
  };

  const handleCellClick = (userId: string, date: Date) => {
    setSelectedUserId(userId);
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDate(null);
    setSelectedUserId(null);
  };

  const handleDialogSuccess = () => {
    // Refresh would be handled by parent component
    handleDialogClose();
  };

  if (teamSummary.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Projects Team Calendar
          </Typography>
          <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            No team workload data available for the selected period.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Projects Team Calendar - {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Workload distribution across all projects. Click on any cell to view and manage daily task allocations.
          </Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 120, position: 'sticky', left: 0, backgroundColor: 'background.paper', zIndex: 2 }}>
                    Team Member
                  </TableCell>
                  {monthDays.map((day) => (
                    <TableCell 
                      key={day.toISOString()} 
                      align="center" 
                      sx={{ 
                        minWidth: 50,
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        backgroundColor: day.getDay() === 0 || day.getDay() === 6 ? 'grey.50' : 'inherit'
                      }}
                    >
                      <Box>
                        <Typography variant="caption" display="block">
                          {format(day, 'EEE')}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {getDate(day)}
                        </Typography>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {teamSummary.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell 
                      sx={{ 
                        position: 'sticky', 
                        left: 0, 
                        backgroundColor: 'background.paper', 
                        zIndex: 1,
                        borderRight: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                          {member.userName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" noWrap>
                            {member.userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.projects.length} project{member.projects.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    {monthDays.map((day) => {
                      const dateString = format(day, 'yyyy-MM-dd');
                      const hours = dailyWorkload[member.userId]?.[dateString] || 0;
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      
                      return (
                        <TableCell 
                          key={`${member.userId}-${day.toISOString()}`}
                          align="center"
                          sx={{ 
                            padding: '4px',
                            cursor: 'pointer',
                            backgroundColor: isWeekend ? 'grey.50' : 'inherit',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                          onClick={() => handleCellClick(member.userId, day)}
                        >
                          {hours > 0 && (
                            <Chip
                              label={`${hours}h`}
                              size="small"
                              color={getWorkloadColor(hours)}
                              sx={{ 
                                fontSize: '0.7rem',
                                height: 20,
                                minWidth: 35
                              }}
                            />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <WorkloadDayAllocationDialog
        open={dialogOpen}
        selectedDate={selectedDate}
        userId={selectedUserId || undefined}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
      />
    </>
  );
};