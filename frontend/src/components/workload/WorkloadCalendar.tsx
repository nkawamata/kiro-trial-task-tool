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
  Tooltip,
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
  isSameDay,
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
  const { summary, entries } = useSelector((state: RootState) => state.workload);
  const { user } = useSelector((state: RootState) => state.auth);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      dispatch(fetchWorkloadSummary({ startDate, endDate }));
      dispatch(fetchWorkloadEntries({ startDate, endDate }));
    }
  }, [dispatch, currentMonth, targetUserId]);

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
    const dayEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return format(entryDate, 'yyyy-MM-dd') === dateString && entry.userId === targetUserId;
    });
    
    // Sum up allocated hours for this day
    const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.allocatedHours || 0), 0);
    
    // Debug logging (remove in production)
    if (totalHours > 0) {
      console.log(`Date ${dateString}: ${totalHours} hours from ${dayEntries.length} entries`);
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
            
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAllocationDialogOpen(true)}
            >
              Add Allocation
            </Button>
          </Box>

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
        </CardContent>
      </Card>

      <WorkloadAllocationDialog
        open={allocationDialogOpen}
        onClose={() => {
          setAllocationDialogOpen(false);
          setSelectedDate(null);
        }}
        onSuccess={() => {
          // Refresh workload data
          const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
          const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
          if (targetUserId) {
            dispatch(fetchWorkloadSummary({ startDate, endDate }));
            dispatch(fetchWorkloadEntries({ startDate, endDate }));
          }
        }}
      />
    </Box>
  );
};