export type ScheduleType = 'DAILY' | 'WEEKDAYS' | 'TIMES_PER_WEEK';

export interface WeekdaysConfig {
  weekdays: number[]; // 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
}

export interface TimesPerWeekConfig {
  targetPerWeek: number; // e.g. 1 to 7
}

export type ScheduleConfiguration = WeekdaysConfig | TimesPerWeekConfig | Record<string, never>;

export interface HabitModel {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  scheduleType: ScheduleType;
  scheduleConfiguration: string; // JSON string
  reminderTime: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitCompletionModel {
  id: string;
  habitId: string;
  localDate: string; // "YYYY-MM-DD"
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserModel {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HeatmapDay {
  date: string; // "YYYY-MM-DD"
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  month: string; // "Jan", "Feb", etc.
  isScheduled: boolean;
  isCompleted: boolean;
  isMissed: boolean;
  isFuture: boolean;
  status: 'completed' | 'missed' | 'unscheduled' | 'future';
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
  completionRate: number; // 0 to 100 percentage
}

export interface DashboardSummary {
  user: {
    id: string;
    name: string;
    email: string;
    timezone: string;
  };
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
