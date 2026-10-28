export type ScheduleType = 'DAILY' | 'WEEKDAYS' | 'TIMES_PER_WEEK';

export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  scheduleType: ScheduleType;
  scheduleConfiguration: string;
  scheduleLabel?: string;
  reminderTime: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  currentStreak?: number;
  longestStreak?: number;
  isScheduledToday?: boolean;
  isCompletedToday?: boolean;
  totalCompletions?: number;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  localDate: string;
  completedAt: string;
}

export interface HeatmapDay {
  date: string;
  dayOfWeek: number;
  month: string;
  isScheduled: boolean;
  isCompleted: boolean;
  isMissed: boolean;
  isFuture: boolean;
  status: 'completed' | 'missed' | 'unscheduled' | 'future';
}

export interface HeatmapResponse {
  habitId: string;
  habitName: string;
  habitColor: string;
  habitIcon: string;
  scheduleType: ScheduleType;
  scheduleLabel: string;
  today: string;
  totalCompleted: number;
  totalScheduled: number;
  days: HeatmapDay[];
}

export interface HabitStats {
  habitId: string;
  habitName: string;
  habitColor: string;
  habitIcon: string;
  scheduleType: ScheduleType;
  scheduleLabel: string;
  currentStreak: number;
  longestStreak: number;
  completedCount: number;
  eligibleCount: number;
  missedCount: number;
  completionRate: number;
}

export interface StatsResponse {
  range: { startDate: string; endDate: string };
  overall: {
    totalCompleted: number;
    totalEligible: number;
    completionRate: number;
  };
  dailyActivity: { date: string; dayLabel: string; completedCount: number }[];
  perHabit: HabitStats[];
  today: string;
}

export interface DashboardData {
  user: User;
  todayLocalDate: string;
  totalActiveHabits: number;
  scheduledTodayCount: number;
  completedTodayCount: number;
  todayCompletionPercentage: number;
  currentStreakHighlight: {
    habitName: string;
    streak: number;
    icon: string;
  } | null;
  longestStreakHighlight: {
    habitName: string;
    streak: number;
    icon: string;
  } | null;
  motivationalMessage: string;
  weeklyActivity: {
    date: string;
    dayLabel: string;
    completed: number;
    totalScheduled: number;
  }[];
  todayHabits: {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    color: string;
    scheduleType: ScheduleType;
    scheduleLabel: string;
    isScheduledToday: boolean;
    isCompletedToday: boolean;
    currentStreak: number;
    longestStreak: number;
    canToggle: boolean;
  }[];
}
