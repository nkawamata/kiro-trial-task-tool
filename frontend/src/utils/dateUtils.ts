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