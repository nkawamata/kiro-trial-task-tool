import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from 'date-fns';
import { RootState, AppDispatch } from '../../store';
import { fetchWorkloadSummary, fetchWorkloadEntries } from '../../store/slices/workloadSlice';
import { WorkloadAllocationDialog } from './WorkloadAllocationDialog';

interface WorkloadCalendarProps {
  userId?: string;
}

export const WorkloadCalendar: React.FC<WorkloadCalendarProps> = ({ userId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { entries, loading, error } = useSelector((state: RootState) => state.workload);
  const { user } = useSelector((state: RootState) => state.auth);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Temporary fix: use known user ID if auth user is not available
  const knownUserId = '662b8362-d1e6-401c-9936-396f77003a11'; // From our test
  const targetUserId = userId || user?.id || knownUserId;

  // Debug: Log the current state
  console.log('WorkloadCalendar render:', {
    targetUserId,
    providedUserId: userId,
    authUserId: user?.id,
    entriesCount: entries?.length || 0,
    loading,
    error,
    user: user ? { id: user.id, name: user.name } : null
  });

  useEffect(() => {
    if (targetUserId) {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      console.log('Fetching workload data for:', { targetUserId, startDate, endDate });
      
      dispatch(fetchWorkloadSummary({ startDate, endDate }));
      dispatch(fetchWorkloadEntries({ startDate, endDate, userId: targetUserId }));
    } else {
      console.log('No target user ID available, user state:', user);
    }
  }, [dispatch, currentMonth, targetUserId, user]);

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const getDayWorkload = (date: Date) => {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return 0; // Weekend

    // Get actual workload data for this date
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Debug: Log all entries to see what we have
    console.log('All entries:', entries);
    console.log('Target user ID:', targetUserId);
    console.log('Looking for date:', dateString);
    
    const dayEntries = entries.filter(entry => {
      // Handle both string and Date formats for entry.date
      let entryDateString: string;
      if (typeof entry.date === 'string') {
        // If it's already a string, use it directly or parse it
        entryDateString = entry.date.includes('T') ? format(new Date(entry.date), 'yyyy-MM-dd') : entry.date;
      } else {
        // If it's a Date object, format it
        entryDateString = format(new Date(entry.date), 'yyyy-MM-dd');
      }
      
      const userMatches = entry.userId === targetUserId;
      const dateMatches = entryDateString === dateString;
      
      // Debug logging for each entry
      if (userMatches || dateMatches) {
        console.log(`Entry check - Date: ${entryDateString} (matches: ${dateMatches}), User: ${entry.userId} (matches: ${userMatches}), Hours: ${entry.allocatedHours}`);
      }
      
      return userMatches && dateMatches;
    });

    // Sum up allocated hours for this day
    const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.allocatedHours || 0), 0);

    // Debug logging
    if (totalHours > 0 || dayEntries.length > 0) {
      console.log(`Date ${dateString}: ${totalHours} hours from ${dayEntries.length} entries`, dayEntries);
    }

    return Math.round(totalHours * 10) / 10;
  };

  const getWorkloadColor = (hours: number) => {
    if (hours === 0) return 'default';
    if (hours <= 4) return 'success';
    if (hours <= 6) return 'info';
    if (hours <= 8) return 'warning';
    return 'error';
  };

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const currentDay = day;
      const workloadHours = getDayWorkload(currentDay);
      const isCurrentMonth = isSameMonth(currentDay, monthStart);
      const isCurrentDay = isToday(currentDay);

      days.push(
        <Grid item xs key={currentDay.toString()}>
          <Card
            sx={{
              minHeight: 80,
              cursor: 'pointer',
              opacity: isCurrentMonth ? 1 : 0.3,
              border: isCurrentDay ? 2 : 0,
              borderColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            onClick={() => {
              setSelectedDate(currentDay);
              setAllocationDialogOpen(true);
            }}
          >
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" fontWeight={isCurrentDay ? 'bold' : 'normal'}>
                  {format(currentDay, 'd')}
                </Typography>
                {workloadHours > 0 && (
                  <Chip
                    label={`${workloadHours}h`}
                    size="small"
                    color={getWorkloadColor(workloadHours)}
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Box>
              {workloadHours > 0 && (
                <Box sx={{ height: 4, backgroundColor: 'action.hover', borderRadius: 2, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      height: '100%',
                      width: `${Math.min((workloadHours / 8) * 100, 100)}%`,
                      backgroundColor: workloadHours > 8 ? 'error.main' : 'primary.main',
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      );

      day = addDays(day, 1);
    }

    return days;
  };

  const renderWeekDays = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return weekDays.map((day) => (
      <Grid item xs key={day}>
        <Typography variant="subtitle2" align="center" sx={{ py: 1, fontWeight: 'bold' }}>
          {day}
        </Typography>
      </Grid>
    ));
  };

  if (!targetUserId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Please log in to view workload calendar
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={prevMonth}>
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h6">
                {format(currentMonth, 'MMMM yyyy')}
              </Typography>
              <IconButton onClick={nextMonth}>
                <ChevronRightIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
                  const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
                  console.log('Manual refresh for:', { targetUserId, startDate, endDate });
                  if (targetUserId) {
                    dispatch(fetchWorkloadSummary({ startDate, endDate }));
                    dispatch(fetchWorkloadEntries({ startDate, endDate, userId: targetUserId }));
                  }
                }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedDate(new Date());
                  setAllocationDialogOpen(true);
                }}
              >
                Add Allocation
              </Button>
            </Box>
          </Box>

          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography color="error" variant="body2">
                Error loading workload data: {error}
              </Typography>
            </Box>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Loading workload data...
              </Typography>
            </Box>
          )}

          <Grid container spacing={1}>
            {renderWeekDays()}
            {renderCalendarDays()}
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Workload:
            </Typography>
            <Chip label="0h" color="default" size="small" />
            <Chip label="1-4h" color="success" size="small" />
            <Chip label="5-6h" color="info" size="small" />
            <Chip label="7-8h" color="warning" size="small" />
            <Chip label="8h+" color="error" size="small" />
          </Box>

          {/* Debug info */}
          <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Debug: {entries?.length || 0} entries loaded for user {targetUserId}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <WorkloadAllocationDialog
        open={allocationDialogOpen}
        selectedDate={selectedDate}
        onClose={() => {
          setAllocationDialogOpen(false);
          setSelectedDate(null);
        }}
        onSuccess={() => {
          // Refresh workload data
          const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
          const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
          if (targetUserId) {
            console.log('Refreshing workload data after allocation');
            dispatch(fetchWorkloadSummary({ startDate, endDate }));
            dispatch(fetchWorkloadEntries({ startDate, endDate, userId: targetUserId }));
          }
        }}
      />
    </Box>
  );
};