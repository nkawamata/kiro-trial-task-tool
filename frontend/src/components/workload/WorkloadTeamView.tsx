import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { WorkloadSummary } from '@task-manager/shared';
import { RootState, AppDispatch } from '../../store';
import { fetchTeamDailyWorkload, fetchAllProjectsTeamWorkloadSummary, fetchAllProjectsDailyWorkload } from '../../store/slices/workloadSlice';
import { WorkloadDayAllocationDialog } from './WorkloadDayAllocationDialog';
import { WorkloadAllProjectsTeamSummary } from './WorkloadAllProjectsTeamSummary';

interface WorkloadTeamViewProps {
  teamWorkload: WorkloadSummary[];
  selectedProject: string;
}

export const WorkloadTeamView: React.FC<WorkloadTeamViewProps> = ({
  teamWorkload,
  selectedProject,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { dailyWorkload, allProjectsTeamSummary, allProjectsDailyWorkload, loading } = useSelector((state: RootState) => state.workload);

  // Debug logging
  console.log('WorkloadTeamView render:', {
    selectedProject,
    teamWorkloadLength: teamWorkload.length,
    dailyWorkloadKeys: Object.keys(dailyWorkload).length,
    allProjectsTeamSummaryLength: allProjectsTeamSummary.length,
    allProjectsDailyWorkloadKeys: Object.keys(allProjectsDailyWorkload).length,
    loading
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());

  // Track the last request to prevent duplicates
  const lastRequestRef = useRef<string | null>(null);

  // Memoize current month dates to prevent infinite re-renders
  const { currentDate, monthDays, startDateString, endDateString } = useMemo(() => {
    const current = new Date();
    const start = startOfMonth(current);
    const end = endOfMonth(current);
    const days = eachDayOfInterval({ start, end });

    return {
      currentDate: current,
      monthDays: days,
      startDateString: format(start, 'yyyy-MM-dd'),
      endDateString: format(end, 'yyyy-MM-dd')
    };
  }, []); // Empty dependency array - only calculate once per component mount

  // If no team workload data but we have daily workload data, create synthetic team workload
  // This must be called before any early returns to maintain hook order
  const effectiveTeamWorkload = useMemo(() => {
    if (teamWorkload.length > 0) {
      return teamWorkload;
    }

    // If we have daily workload data but no team workload, create synthetic team workload
    if (Object.keys(dailyWorkload).length > 0) {
      console.log('Creating synthetic team workload from daily workload data');

      return Object.keys(dailyWorkload).map(userId => ({
        userId,
        userName: userNames.get(userId) || `User ${userId.substring(0, 8)}`, // Use fetched name if available, fallback otherwise
        totalAllocatedHours: Object.values(dailyWorkload[userId] || {}).reduce((sum, hours) => sum + hours, 0),
        totalActualHours: 0,
        projects: []
      }));
    }

    return [];
  }, [teamWorkload, dailyWorkload, userNames]);

  // Effect to fetch user names when we have daily workload but no team workload
  useEffect(() => {
    const fetchUserNames = async () => {
      if (teamWorkload.length === 0 && Object.keys(dailyWorkload).length > 0) {
        const { userService } = await import('../../services/userService');

        const userIds = Object.keys(dailyWorkload);
        const missingUserIds = userIds.filter(userId => !userNames.has(userId));

        if (missingUserIds.length > 0) {
          console.log('Fetching user names for:', missingUserIds);
          const newUserNames = new Map(userNames);

          // Fetch all missing user names in parallel
          const userPromises = missingUserIds.map(async (userId) => {
            try {
              const user = await userService.getUser(userId);
              return { userId, userName: user.name };
            } catch (error) {
              console.error(`Failed to fetch user name for ${userId}:`, error);
              return { userId, userName: `User ${userId.substring(0, 8)}` };
            }
          });

          const userResults = await Promise.all(userPromises);
          userResults.forEach(({ userId, userName }) => {
            newUserNames.set(userId, userName);
          });

          setUserNames(newUserNames);
        }
      }
    };

    fetchUserNames();
  }, [teamWorkload.length, Object.keys(dailyWorkload).sort().join(','), userNames.size]); // Use sorted join and size to track changes

  useEffect(() => {
    if (selectedProject === 'all') {
      const requestKey = `all-projects-${startDateString}-${endDateString}`;

      // Only make request if it's different from the last one
      if (lastRequestRef.current !== requestKey) {
        console.log('Fetching all projects team summary and daily workload for:', { startDateString, endDateString });
        lastRequestRef.current = requestKey;

        // Fetch both summary and daily workload data for all projects
        dispatch(fetchAllProjectsTeamWorkloadSummary({
          startDate: startDateString,
          endDate: endDateString
        }));

        dispatch(fetchAllProjectsDailyWorkload({
          startDate: startDateString,
          endDate: endDateString
        }));
      }
    } else if (selectedProject) {
      const requestKey = `${selectedProject}-${startDateString}-${endDateString}`;

      // Only make request if it's different from the last one
      if (lastRequestRef.current !== requestKey) {
        console.log('Fetching team daily workload for specific project:', {
          selectedProject,
          startDateString,
          endDateString,
          currentDailyWorkload: Object.keys(dailyWorkload).length
        });
        lastRequestRef.current = requestKey;

        dispatch(fetchTeamDailyWorkload({
          projectId: selectedProject,
          startDate: startDateString,
          endDate: endDateString
        }));
      }
    }
  }, [dispatch, selectedProject, startDateString, endDateString, dailyWorkload]);

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
    // Refresh the daily workload data
    if (selectedProject === 'all') {
      console.log('Refreshing all projects daily workload after dialog success');

      dispatch(fetchAllProjectsDailyWorkload({
        startDate: startDateString,
        endDate: endDateString
      }));
    } else if (selectedProject) {
      console.log('Refreshing team daily workload after dialog success');

      dispatch(fetchTeamDailyWorkload({
        projectId: selectedProject,
        startDate: startDateString,
        endDate: endDateString
      }));
    }
  };

  // Early return for "All Projects" view - after all hooks have been called
  if (selectedProject === 'all') {
    return (
      <WorkloadAllProjectsTeamSummary
        teamSummary={allProjectsTeamSummary}
        dailyWorkload={allProjectsDailyWorkload}
        loading={loading}
      />
    );
  }

  if (effectiveTeamWorkload.length === 0) {
    console.log('WorkloadTeamView: No team workload data', {
      selectedProject,
      teamWorkloadLength: teamWorkload.length,
      dailyWorkloadKeys: Object.keys(dailyWorkload),
      startDateString,
      endDateString
    });

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Team Workload Calendar
          </Typography>
          <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            No team workload data available for the selected project and period.
          </Typography>
          <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ display: 'block', mt: 2 }}>
            Project: {selectedProject} | Date Range: {startDateString} to {endDateString}
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
            Team Workload Calendar - {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click on any cell to view and manage daily task allocations
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
                {effectiveTeamWorkload.map((member) => (
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
                        <Typography variant="body2" noWrap>
                          {member.userName}
                        </Typography>
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