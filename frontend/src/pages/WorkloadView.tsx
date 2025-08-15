import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  WorkOutline as WorkloadIcon,
} from '@mui/icons-material';
import { format, addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { RootState, AppDispatch } from '../store';
import { fetchWorkloadSummary, fetchWorkloadDistribution, fetchTeamWorkload, fetchWorkloadEntries } from '../store/slices/workloadSlice';
import { fetchProjects } from '../store/slices/projectsSlice';
import { 
  WorkloadAllocationDialog,
  WorkloadDashboard
} from '../components/workload';

export const WorkloadView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { summary, distribution, loading } = useSelector((state: RootState) => state.workload);

  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'thisWeek' | 'nextWeek' | 'afterTwoWeeks' | 'afterThreeWeeks'>('thisWeek');
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (dateRange) {
      case 'thisWeek':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'nextWeek':
        const nextWeekStart = addWeeks(now, 1);
        startDate = startOfWeek(nextWeekStart);
        endDate = endOfWeek(nextWeekStart);
        break;
      case 'afterTwoWeeks':
        const twoWeeksStart = addWeeks(now, 2);
        startDate = startOfWeek(twoWeeksStart);
        endDate = endOfWeek(twoWeeksStart);
        break;
      case 'afterThreeWeeks':
        const threeWeeksStart = addWeeks(now, 3);
        startDate = startOfWeek(threeWeeksStart);
        endDate = endOfWeek(threeWeeksStart);
        break;
      default:
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  }, [dateRange]);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchWorkloadDistribution());
    
    const { startDate, endDate } = getDateRange();
    dispatch(fetchWorkloadSummary({ startDate, endDate }));
  }, [dispatch, dateRange, getDateRange]);

  useEffect(() => {
    if (selectedProject !== 'all') {
      const { startDate, endDate } = getDateRange();
      dispatch(fetchTeamWorkload({ projectId: selectedProject, startDate, endDate }));
    }
  }, [dispatch, selectedProject, dateRange, getDateRange]);

  if (loading && !summary && !distribution) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <WorkloadIcon />
        <Typography variant="h4" component="h1">
          Workload Management
        </Typography>
      </Box>

      <WorkloadDashboard
        onRefresh={() => {
          dispatch(fetchWorkloadDistribution());
          const { startDate, endDate } = getDateRange();
          dispatch(fetchWorkloadSummary({ startDate, endDate }));
          dispatch(fetchWorkloadEntries({ startDate, endDate }));
        }}
        onAllocateWork={() => {
          setSelectedDate(new Date());
          setAllocationDialogOpen(true);
        }}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <WorkloadAllocationDialog
        open={allocationDialogOpen}
        selectedDate={selectedDate}
        onClose={() => {
          setAllocationDialogOpen(false);
          setSelectedDate(null);
        }}
        onSuccess={() => {
          // Refresh workload data
          dispatch(fetchWorkloadDistribution());
          const { startDate, endDate } = getDateRange();
          dispatch(fetchWorkloadSummary({ startDate, endDate }));
        }}
      />
    </Box>
  );
};