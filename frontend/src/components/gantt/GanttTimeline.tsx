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
  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 3, 0)
      };
    }

    const startDates = tasks.map(t => t.start.getTime());
    const endDates = tasks.map(t => t.end.getTime());
    
    const minStart = new Date(Math.min(...startDates));
    const maxEnd = new Date(Math.max(...endDates));
    
    // Add some padding
    const padding = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    return {
      start: new Date(minStart.getTime() - padding),
      end: new Date(maxEnd.getTime() + padding)
    };
  }, [tasks]);

  // Generate time scale based on view mode
  const timeScale = useMemo(() => {
    const { start, end } = timelineBounds;
    const scale: { date: Date; label: string; isMainTick: boolean }[] = [];
    
    const current = new Date(start);
    
    while (current <= end) {
      let label = '';
      let isMainTick = false;
      
      switch (viewMode) {
        case 'day':
          label = current.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          isMainTick = current.getDate() === 1 || current.getDay() === 1; // First of month or Monday
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
      
      scale.push({ date: new Date(current), label, isMainTick });
    }
    
    return scale;
  }, [timelineBounds, viewMode]);

  // Calculate task positions
  const getTaskPosition = (task: GanttTask) => {
    const totalDuration = timelineBounds.end.getTime() - timelineBounds.start.getTime();
    const taskStart = task.start.getTime() - timelineBounds.start.getTime();
    const taskDuration = task.end.getTime() - task.start.getTime();
    
    const left = (taskStart / totalDuration) * 100;
    const width = (taskDuration / totalDuration) * 100;
    
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
        height: '60px', 
        borderBottom: '2px solid #e0e0e0',
        backgroundColor: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 1
      }}>
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          position: 'relative',
          overflow: 'hidden'
        }}>
          {timeScale.map((tick, index) => {
            const position = ((tick.date.getTime() - timelineBounds.start.getTime()) / 
              (timelineBounds.end.getTime() - timelineBounds.start.getTime())) * 100;
            
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
          const today = new Date();
          if (today >= timelineBounds.start && today <= timelineBounds.end) {
            const position = ((today.getTime() - timelineBounds.start.getTime()) / 
              (timelineBounds.end.getTime() - timelineBounds.start.getTime())) * 100;
            
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