import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  Group as TeamIcon,
  TrendingUp as TrendingUpIcon,
  Lightbulb as InsightsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { WorkloadSummary } from './WorkloadSummary';
import { WorkloadCalendar } from './WorkloadCalendar';
import { WorkloadTeamView } from './WorkloadTeamView';
import { WorkloadChart } from './WorkloadChart';
import { WorkloadInsights } from './WorkloadInsights';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workload-dashboard-tabpanel-${index}`}
      aria-labelledby={`workload-dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface WorkloadDashboardProps {
  onRefresh: () => void;
  onAllocateWork: () => void;
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
  dateRange: 'thisWeek' | 'nextWeek' | 'afterTwoWeeks' | 'afterThreeWeeks';
  onDateRangeChange: (range: 'thisWeek' | 'nextWeek' | 'afterTwoWeeks' | 'afterThreeWeeks') => void;
}

export const WorkloadDashboard: React.FC<WorkloadDashboardProps> = ({
  onRefresh,
  onAllocateWork,
  selectedProject,
  onProjectChange,
  dateRange,
  onDateRangeChange,
}) => {
  const { summary, distribution, teamWorkload, loading, error } = useSelector((state: RootState) => state.workload);
  const { projects } = useSelector((state: RootState) => state.projects);

  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading && !summary && !distribution) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DashboardIcon />
          Workload Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAllocateWork}
            size="small"
          >
            Allocate Work
          </Button>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={dateRange}
              label="Time Range"
              onChange={(e) => onDateRangeChange(e.target.value as 'thisWeek' | 'nextWeek' | 'afterTwoWeeks' | 'afterThreeWeeks')}
            >
              <MenuItem value="thisWeek">This Week</MenuItem>
              <MenuItem value="nextWeek">Next Week</MenuItem>
              <MenuItem value="afterTwoWeeks">After Two Weeks</MenuItem>
              <MenuItem value="afterThreeWeeks">After Three Weeks</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}



      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<DashboardIcon />} label="Overview" />
            <Tab icon={<CalendarIcon />} label="Calendar" />
            <Tab icon={<TeamIcon />} label="Team" />
            <Tab icon={<TrendingUpIcon />} label="Analytics" />
            <Tab icon={<InsightsIcon />} label="Insights" />
          </Tabs>
        </Box>

        <CardContent>
          <TabPanel value={tabValue} index={0}>
            <WorkloadSummary 
              summary={summary} 
              distribution={distribution} 
              teamWorkload={teamWorkload} 
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <WorkloadCalendar />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 3 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select Project</InputLabel>
                <Select
                  value={selectedProject}
                  label="Select Project"
                  onChange={(e) => onProjectChange(e.target.value)}
                >
                  <MenuItem value="all">All Projects</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <WorkloadTeamView 
              teamWorkload={teamWorkload} 
              selectedProject={selectedProject} 
            />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <WorkloadChart summary={summary} distribution={distribution} />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <WorkloadInsights 
              summary={summary} 
              distribution={distribution} 
              teamWorkload={teamWorkload} 
            />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};