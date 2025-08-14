import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { ChevronLeft, ChevronRight, Today } from '@mui/icons-material';
import { GanttTask, Task } from '@task-manager/shared';
import { formatDuration, calculateDuration } from '../../utils/dateUtils';

interface GanttTimelineProps {
  tasks: GanttTask[];
  viewMode: 'day' | 'week' | 'month' | 'quarter';
  selectedUserId?: string;
  onTaskClick: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  getTaskColor: (task: GanttTask) => string;
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  tasks,
  viewMode,
  selectedUserId,
  onTaskClick,
  onTaskUpdate,
  getTaskColor
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Simple date normalization that preserves the local date
  const normalizeDateString = (date: Date) => {
    // Simply create a new date with the same year, month, day in local timezone
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };
  // Calculate timeline bounds with extended range for scrolling
  const timelineBounds = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      return {
        start: normalizeDateString(new Date(now.getFullYear() - 1, 0, 1)), // Start from beginning of last year
        end: normalizeDateString(new Date(now.getFullYear() + 2, 11, 31))  // End at end of next year
      };
    }

    // Find the actual min and max dates from tasks
    const taskDates = tasks.flatMap(t => [t.start, t.end]);
    const minDate = new Date(Math.min(...taskDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...taskDates.map(d => d.getTime())));
    
    // Create timeline bounds that start from the beginning of the month containing the earliest task
    // and end at the end of the month containing the latest task, with some padding
    const startMonth = new Date(minDate.getFullYear(), minDate.getMonth() - 6, 1); // 6 months before
    const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth() + 7, 0); // 6 months after, last day of month
    
    return {
      start: normalizeDateString(startMonth),
      end: normalizeDateString(endMonth)
    };
  }, [tasks]);

  // Generate time scale based on view mode
  const timeScale = useMemo(() => {
    // Use the same normalized bounds as task positioning for consistency
    const timelineStart = normalizeDateString(timelineBounds.start);
    const timelineEnd = normalizeDateString(timelineBounds.end);
    const scale: { date: Date; label: string; isMainTick: boolean; showLabel: boolean; monthLabel?: string }[] = [];
    
    // Start from the normalized timeline start
    const current = new Date(timelineStart);
    current.setHours(0, 0, 0, 0);
    let lastMonth = -1;
    
    while (current <= timelineEnd) {
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
          

          
          // Store the current date BEFORE incrementing
          scale.push({ date: new Date(current), label, isMainTick, showLabel, monthLabel });
          current.setDate(current.getDate() + 1);
          continue; // Skip the push at the end since we already did it
          
        case 'week':
          label = current.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          isMainTick = current.getDate() <= 7; // First week of month
          
          // Store the current date BEFORE incrementing
          scale.push({ date: new Date(current), label, isMainTick, showLabel, monthLabel });
          current.setDate(current.getDate() + 7);
          continue; // Skip the push at the end since we already did it
          
        case 'month':
          label = current.toLocaleDateString('en-US', { 
            month: 'short', 
            year: current.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
          });
          isMainTick = current.getMonth() % 3 === 0; // Every quarter
          
          // Store the current date BEFORE incrementing
          scale.push({ date: new Date(current), label, isMainTick, showLabel, monthLabel });
          current.setMonth(current.getMonth() + 1);
          continue; // Skip the push at the end since we already did it
          
        case 'quarter':
          label = `Q${Math.floor(current.getMonth() / 3) + 1} ${current.getFullYear()}`;
          isMainTick = current.getMonth() === 0; // Every year
          
          // Store the current date BEFORE incrementing
          scale.push({ date: new Date(current), label, isMainTick, showLabel, monthLabel });
          current.setMonth(current.getMonth() + 3);
          continue; // Skip the push at the end since we already did it
      }
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

  // Month navigation functions
  const scrollToMonth = useCallback((targetMonth: Date) => {
    if (!scrollContainerRef.current) return;

    const timelineStart = normalizeDateString(timelineBounds.start);
    const timelineEnd = normalizeDateString(timelineBounds.end);
    const targetDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    const targetOffset = targetDate.getTime() - timelineStart.getTime();
    const scrollPercentage = Math.max(0, Math.min(1, targetOffset / totalDuration));
    
    const containerWidth = scrollContainerRef.current.clientWidth;
    const scrollableWidth = scrollContainerRef.current.scrollWidth - containerWidth;
    const scrollPosition = scrollPercentage * scrollableWidth;
    
    // Center the target month in the view
    const centeredPosition = Math.max(0, scrollPosition - containerWidth * 0.2);
    
    scrollContainerRef.current.scrollTo({
      left: centeredPosition,
      behavior: 'smooth'
    });
    
    // Also scroll the header to maintain sync
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollTo({
        left: centeredPosition,
        behavior: 'smooth'
      });
    }
  }, [timelineBounds]);

  const scrollToPreviousMonth = useCallback(() => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
    scrollToMonth(prevMonth);
  }, [currentMonth, scrollToMonth]);

  const scrollToNextMonth = useCallback(() => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
    scrollToMonth(nextMonth);
  }, [currentMonth, scrollToMonth]);

  const scrollToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    scrollToMonth(today);
  }, [scrollToMonth]);

  // Initialize scroll position to current month on mount
  useEffect(() => {
    if (scrollContainerRef.current && tasks.length > 0) {
      // Set initial month to first task's month or current month
      const firstTask = tasks.sort((a, b) => a.start.getTime() - b.start.getTime())[0];
      const initialMonth = firstTask ? firstTask.start : new Date();
      setCurrentMonth(initialMonth);
      
      // Small delay to ensure DOM is ready
      setTimeout(() => scrollToMonth(initialMonth), 100);
    }
  }, [tasks, timelineBounds, scrollToMonth]);

  // Sync header scroll with content scroll and update current month
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      // Sync header scroll with content scroll
      if (headerScrollRef.current) {
        headerScrollRef.current.scrollLeft = scrollContainer.scrollLeft;
      }
      
      // Fallback: Also try to find header by data attribute if ref fails
      if (!headerScrollRef.current) {
        const headerElement = document.querySelector('[data-header-content]') as HTMLElement;
        if (headerElement && headerElement.parentElement) {
          headerElement.parentElement.scrollLeft = scrollContainer.scrollLeft;
        }
      }

      // Update current month based on scroll position
      const scrollPercentage = scrollContainer.scrollLeft / (scrollContainer.scrollWidth - scrollContainer.clientWidth);
      const timelineStart = normalizeDateString(timelineBounds.start);
      const timelineEnd = normalizeDateString(timelineBounds.end);
      const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
      const currentTime = timelineStart.getTime() + (scrollPercentage * totalDuration);
      const visibleMonth = new Date(currentTime);
      
      // Only update if month actually changed to avoid unnecessary re-renders
      if (visibleMonth.getMonth() !== currentMonth.getMonth() || 
          visibleMonth.getFullYear() !== currentMonth.getFullYear()) {
        setCurrentMonth(visibleMonth);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [timelineBounds, currentMonth]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body) return; // Only handle when no input is focused
      
      switch (event.key) {
        case 'ArrowLeft':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            scrollToPreviousMonth();
          }
          break;
        case 'ArrowRight':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            scrollToNextMonth();
          }
          break;
        case 'Home':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            scrollToToday();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [scrollToPreviousMonth, scrollToNextMonth, scrollToToday]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Controls */}
      <Box sx={{ 
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Previous Month">
            <IconButton size="small" onClick={scrollToPreviousMonth}>
              <ChevronLeft />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next Month">
            <IconButton size="small" onClick={scrollToNextMonth}>
              <ChevronRight />
            </IconButton>
          </Tooltip>
          <Tooltip title="Go to Today">
            <IconButton size="small" onClick={scrollToToday}>
              <Today />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ 
          fontSize: '0.875rem', 
          fontWeight: 'medium',
          color: '#1976d2',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Box>
            {currentMonth.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </Box>
          <Box sx={{ 
            fontSize: '0.75rem', 
            color: '#666',
            fontWeight: 'normal'
          }}>
            (Use Ctrl+← → or buttons to navigate)
          </Box>
        </Box>
      </Box>

      {/* Timeline Header */}
      <Box 
        ref={headerScrollRef}
        sx={{ 
          height: viewMode === 'day' ? '80px' : '60px', 
          borderBottom: '2px solid #e0e0e0',
          backgroundColor: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none' // Hide scrollbar but keep scrolling functionality
          },
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // IE/Edge
        }}
      >
        <Box 
          data-header-content
          sx={{ 
            minWidth: viewMode === 'day' ? '800%' : viewMode === 'week' ? '400%' : '200%', // Adjusted for fixed-width cells
            height: '100%'
          }}
        >
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
                      backgroundColor: '#f5f5f5',
                      minWidth: '80px', // Consistent with day cell groupings
                      overflow: 'hidden'
                    }}
                  >
                    <Box sx={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: '#1976d2',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
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
                
                // Check if it's a weekend for styling
                const isWeekend = tickDate.getDay() === 0 || tickDate.getDay() === 6; // Sunday or Saturday
                
                return (
                  <Box
                    key={`day-${index}`}
                    sx={{
                      position: 'absolute',
                      left: `${position}%`,
                      height: '100%',
                      borderLeft: tick.isMainTick ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      width: '50px',
                      overflow: 'hidden',
                      backgroundColor: isWeekend ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '4px', // Simple left padding for now
                      fontSize: '0.75rem',
                      fontWeight: tick.isMainTick ? 'bold' : 'normal',
                      color: isWeekend 
                        ? (tick.isMainTick ? '#1976d2' : '#999') 
                        : (tick.isMainTick ? '#1976d2' : '#666'),
                      lineHeight: 1,
                      userSelect: 'none',
                      
                      '&:hover': {
                        backgroundColor: isWeekend 
                          ? 'rgba(25, 118, 210, 0.12)' 
                          : 'rgba(25, 118, 210, 0.08)'
                      }
                    }}
                  >
                    {tick.label}
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
                    paddingLeft: viewMode === 'week' ? '12px' : '8px', // More padding for week view
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: viewMode === 'week' ? '100px' : '50px' // Much larger cells for week view
                  }}
                >
                  <Box sx={{
                    fontSize: viewMode === 'week' ? '1rem' : '0.9rem', // Larger font for week view
                    fontWeight: tick.isMainTick ? 'bold' : 'normal',
                    color: tick.isMainTick ? '#1976d2' : '#666',
                    whiteSpace: 'nowrap',
                    minWidth: viewMode === 'week' ? '80px' : '40px' // Ensure text has enough space
                  }}>
                    {tick.label}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
        </Box>
      </Box>

      {/* Task Bars */}
      <Box 
        ref={scrollContainerRef}
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          position: 'relative',
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#a8a8a8',
          }
        }}
      >
        <Box sx={{ 
          minWidth: viewMode === 'day' ? '800%' : viewMode === 'week' ? '400%' : '200%', // Match header width
          height: `${Math.max(tasks.length * 50 + 50, 400)}px`, // Dynamic height based on task count
          position: 'relative'
        }}>
        {tasks.map((task, index) => {
          const position = getTaskPosition(task);
          const color = getTaskColor(task);
          
          // Check if this task matches the selected user filter
          const isHighlighted = selectedUserId && (
            (selectedUserId === 'unassigned' && !task.assignee) ||
            (task.assignee && task.assignee.includes(selectedUserId))
          );
          
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
                boxShadow: isHighlighted 
                  ? '0 4px 12px rgba(25, 118, 210, 0.4)' 
                  : '0 2px 4px rgba(0,0,0,0.1)',
                border: isHighlighted ? '2px solid #1976d2' : 'none',
                '&:hover': {
                  boxShadow: isHighlighted 
                    ? '0 6px 16px rgba(25, 118, 210, 0.5)' 
                    : '0 4px 8px rgba(0,0,0,0.2)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              onClick={() => handleTaskBarClick(task)}
              title={`${task.name}\n${getTaskDurationText(task.start, task.end)}\nProgress: ${task.progress}%${task.assignee ? `\nAssignee: ${task.assignee}` : ''}`}
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
    </Box>
  );
};