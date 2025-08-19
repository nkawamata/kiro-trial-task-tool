export const formatDate = (date: Date | string, format?: string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'MM/dd/yyyy') {
    return d.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  }
  
  // Default format: YYYY-MM-DD
  return d.toISOString().split('T')[0];
};

export const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  return date;
};

export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set time to start of day for comparison
  d.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  return d >= start && d <= end;
};

export const getDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const subtractDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

export const getDaysDifference = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date2.getTime() - date1.getTime()) / oneDay);
};

export const formatDateForAPI = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

export const getWorkingDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

export const formatDateRange = (start: Date, end: Date): string => {
  const startStr = start.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: start.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
  
  const endStr = end.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: end.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
  
  return `${startStr} - ${endStr}`;
};

export const calculateDuration = (start: Date, end: Date): number => {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

export const formatDuration = (days: number): string => {
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  
  if (weeks === 1 && remainingDays === 0) return '1 week';
  if (remainingDays === 0) return `${weeks} weeks`;
  if (weeks === 1) return `1 week, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
  
  return `${weeks} weeks, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isOverdue = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

export const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getQuarterStart = (date: Date): Date => {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1);
};