import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { GanttTask, Task } from '@task-manager/shared';
import { formatDuration, calculateDuration } from '../../utils/dateUtils';

interface GanttTimelineProps {
  tasks: GanttTask[];
  viewMode: 'day' | 'week' | 'month' | 'quarter';
  onTaskClick: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  getTaskColor: (task: GanttTask) => string;
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  tasks,
  viewMode,
  onTaskClick,
  onTaskUpdate,
  getTaskColor
}) => {


  // Simple date normalization that preserves the local date
  const normalizeDateString = (date: Date) => {
    // Simply create a new date with the same year, month, day in local timezone
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };
  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {

    if (tasks.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 3, 0)
      };
    }

    // Normalize all dates to start of day using JST-compatible method
    const startDates = tasks.map(t => normalizeDateString(t.start).getTime());
    const endDates = tasks.map(t => normalizeDateString(t.end).getTime());
    
    const minStart = new Date(Math.min(...startDates));
    const maxEnd = new Date(Math.max(...endDates));
    
    // Add padding in days (not milliseconds to avoid timezone issues)
    const paddingDays = 7;
    const startWithPadding = new Date(minStart);
    startWithPadding.setDate(startWithPadding.getDate() - paddingDays);
    
    const endWithPadding = new Date(maxEnd);
    endWithPadding.setDate(endWithPadding.getDate() + paddingDays);
    
    return {
      start: startWithPadding,
      end: endWithPadding
    };
  }, [tasks]);

  // Generate time scale based on view mode
  const timeScale = useMemo(() => {
    const { start, end } = timelineBounds;
    const scale: { date: Date; label: string; isMainTick: boolean; showLabel: boolean; monthLabel?: string }[] = [];
    
    // Start from the beginning of the start date
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    let lastMonth = -1;
    
    while (current <= end) {
      let label = '';
      let isMainTick = false;
      let showLabel = true;
      let monthLabel = '';
      
      switch (viewMode) {
        case 'day':
          // For daily view, show day numbers and month headers
          label = current.getDate().toString();
          isMainTick = current.getDay() === 1; // Monday
          
          // Add month label for first day of month or when month changes
          if (current.getMonth() !== lastMonth) {
            monthLabel = current.toLocaleDateString('en-US', { 
              month: 'short',
              year: current.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
            });
            lastMonth = current.getMonth();
          }
          
          current.setDate(current.getDate() + 1);
          break;
          
        case 'week':
          label = current.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          isMainTick = current.getDate() <= 7; // First week of month
          current.setDate(current.getDate() + 7);
          break;
          
        case 'month':
          label = current.toLocaleDateString('en-US', { 
            month: 'short', 
            year: current.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
          });
          isMainTick = current.getMonth() % 3 === 0; // Every quarter
          current.setMonth(current.getMonth() + 1);
          break;
          
        case 'quarter':
          label = `Q${Math.floor(current.getMonth() / 3) + 1} ${current.getFullYear()}`;
          isMainTick = current.getMonth() === 0; // Every year
          current.setMonth(current.getMonth() + 3);
          break;
      }
      
      scale.push({ date: new Date(current), label, isMainTick, showLabel, monthLabel });
    }
    
    return scale;
  }, [timelineBounds, viewMode]);

  // Calculate task positions
  const getTaskPosition = (task: GanttTask) => {
    // Use the more robust date normalization for JST compatibility
    const timelineStart = normalizeDateString(timelineBounds.start);
    const timelineEnd = normalizeDateString(timelineBounds.end);
    const taskStart = normalizeDateString(task.start);
    const taskEnd = normalizeDateString(task.end);
    
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    const taskStartOffset = taskStart.getTime() - timelineStart.getTime();
    const taskDuration = taskEnd.getTime() - taskStart.getTime();
    
    const left = (taskStartOffset / totalDuration) * 100;
    const width = Math.max((taskDuration / totalDuration) * 100, 0.5); // Minimum width for visibility
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const handleTaskBarClick = (task: GanttTask) => {
    onTaskClick(task.id);
  };

  const getTaskDurationText = (start: Date, end: Date) => {
    const days = calculateDuration(start, end);
    return formatDuration(days);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Timeline Header */}
      <Box sx={{ 
        height: viewMode === 'day' ? '80px' : '60px', 
        borderBottom: '2px solid #e0e0e0',
        backgroundColor: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 1
      }}>
        {viewMode === 'day' ? (
          // Two-row header for daily view
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Month row */}
            <Box sx={{ 
              height: '40px', 
              display: 'flex', 
              position: 'relative',
              borderBottom: '1px solid #e0e0e0'
            }}>
              {timeScale.map((tick, index) => {
                if (!tick.monthLabel) return null;
                
                // Normalize dates for consistent positioning
                
                const timelineStart = normalizeDateString(timelineBounds.start);
                const timelineEnd = normalizeDateString(timelineBounds.end);
                const tickDate = normalizeDateString(tick.date);
                
                const position = ((tickDate.getTime() - timelineStart.getTime()) / 
                  (timelineEnd.getTime() - timelineStart.getTime())) * 100;
                
                return (
                  <Box
                    key={`month-${index}`}
                    sx={{
                      position: 'absolute',
                      left: `${position}%`,
                      height: '100%',
                      paddingLeft: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#f5f5f5'
                    }}
                  >
                    <Box sx={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: '#1976d2',
                      whiteSpace: 'nowrap'
                    }}>
                      {tick.monthLabel}
                    </Box>
                  </Box>
                );
              })}
            </Box>
            
            {/* Day row */}
            <Box sx={{ 
              height: '40px', 
              display: 'flex', 
              position: 'relative'
            }}>
              {timeScale.map((tick, index) => {
                // Normalize dates for consistent positioning
                
                const timelineStart = normalizeDateString(timelineBounds.start);
                const timelineEnd = normalizeDateString(timelineBounds.end);
                const tickDate = normalizeDateString(tick.date);
                
                const position = ((tickDate.getTime() - timelineStart.getTime()) / 
                  (timelineEnd.getTime() - timelineStart.getTime())) * 100;
                
                return (
                  <Box
                    key={`day-${index}`}
                    sx={{
                      position: 'absolute',
                      left: `${position}%`,
                      height: '100%',
                      borderLeft: tick.isMainTick ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      paddingLeft: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: '25px'
                    }}
                  >
                    <Box sx={{
                      fontSize: '0.7rem',
                      fontWeight: tick.isMainTick ? 'bold' : 'normal',
                      color: tick.isMainTick ? '#1976d2' : '#666',
                      textAlign: 'center',
                      width: '20px'
                    }}>
                      {tick.label}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ) : (
          // Single row header for other views
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            position: 'relative',
            overflow: 'hidden'
          }}>
            {timeScale.map((tick, index) => {
              // Normalize dates for consistent positioning
              
              const timelineStart = normalizeDateString(timelineBounds.start);
              const timelineEnd = normalizeDateString(timelineBounds.end);
              const tickDate = normalizeDateString(tick.date);
              
              const position = ((tickDate.getTime() - timelineStart.getTime()) / 
                (timelineEnd.getTime() - timelineStart.getTime())) * 100;
              
              return (
                <Box
                  key={index}
                  sx={{
                    position: 'absolute',
                    left: `${position}%`,
                    height: '100%',
                    borderLeft: tick.isMainTick ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    paddingLeft: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Box sx={{
                    fontSize: '0.75rem',
                    fontWeight: tick.isMainTick ? 'bold' : 'normal',
                    color: tick.isMainTick ? '#1976d2' : '#666',
                    whiteSpace: 'nowrap'
                  }}>
                    {tick.label}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Task Bars */}
      <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {tasks.map((task, index) => {
          const position = getTaskPosition(task);
          const color = getTaskColor(task);
          
          return (
            <Box
              key={task.id}
              sx={{
                position: 'absolute',
                top: `${index * 50 + 10}px`,
                left: position.left,
                width: position.width,
                height: '30px',
                backgroundColor: color,
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                paddingX: 1,
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 'medium',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              onClick={() => handleTaskBarClick(task)}
              title={`${task.name}\n${getTaskDurationText(task.start, task.end)}\nProgress: ${task.progress}%`}
            >
              {/* Progress indicator */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${task.progress}%`,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  borderRadius: '4px 0 0 4px'
                }}
              />
              
              {/* Task name */}
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                {task.name}
              </Box>
            </Box>
          );
        })}

        {/* Dependency lines */}
        {tasks.map((task) => 
          task.dependencies.map((depId) => {
            const depTask = tasks.find(t => t.id === depId);
            if (!depTask) return null;

            const taskIndex = tasks.findIndex(t => t.id === task.id);
            const depIndex = tasks.findIndex(t => t.id === depId);
            
            const taskPos = getTaskPosition(task);
            const depPos = getTaskPosition(depTask);
            
            // Simple line from end of dependency to start of task
            const startY = depIndex * 50 + 25;
            const endY = taskIndex * 50 + 25;
            const startX = parseFloat(depPos.left) + parseFloat(depPos.width);
            const endX = parseFloat(taskPos.left);

            return (
              <svg
                key={`${task.id}-${depId}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 0
                }}
              >
                <line
                  x1={`${startX}%`}
                  y1={startY}
                  x2={`${endX}%`}
                  y2={endY}
                  stroke="#666"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  markerEnd="url(#arrowhead)"
                />
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#666"
                    />
                  </marker>
                </defs>
              </svg>
            );
          })
        )}

        {/* Today line */}
        {(() => {
          
          const today = normalizeDateString(new Date());
          const timelineStart = normalizeDateString(timelineBounds.start);
          const timelineEnd = normalizeDateString(timelineBounds.end);
          
          if (today >= timelineStart && today <= timelineEnd) {
            const position = ((today.getTime() - timelineStart.getTime()) / 
              (timelineEnd.getTime() - timelineStart.getTime())) * 100;
            
            return (
              <Box
                sx={{
                  position: 'absolute',
                  left: `${position}%`,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  backgroundColor: '#f44336',
                  zIndex: 2,
                  '&::before': {
                    content: '"Today"',
                    position: 'absolute',
                    top: '-20px',
                    left: '-20px',
                    fontSize: '0.75rem',
                    color: '#f44336',
                    fontWeight: 'bold'
                  }
                }}
              />
            );
          }
          return null;
        })()}
      </Box>
    </Box>
  );
};