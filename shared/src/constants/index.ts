export const API_ENDPOINTS = {
  AUTH: '/auth',
  PROJECTS: '/projects',
  TASKS: '/tasks',
  USERS: '/users',
  WORKLOAD: '/workload',
  GANTT: '/gantt'
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'yyyy-MM-dd HH:mm:ss'
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const;

export const WORKLOAD_LIMITS = {
  MAX_HOURS_PER_DAY: 8,
  MAX_HOURS_PER_WEEK: 40,
  OVERTIME_THRESHOLD: 1.2
} as const;

export const GANTT_CONFIG = {
  MIN_TASK_DURATION_DAYS: 1,
  MAX_ZOOM_LEVEL: 4,
  DEFAULT_VIEW: 'week'
} as const;