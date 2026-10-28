import { Habit, HabitCompletion, HeatmapResponse, StatsResponse, DashboardData, User } from '../types';

const DEMO_USER: User = {
  id: 'demo-user-alex',
  name: 'Alex Morgan',
  email: 'demo@habitflow.app',
  timezone: 'UTC',
};

const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-read-daily',
    userId: DEMO_USER.id,
    name: 'Read 20 minutes',
    description: 'Read non-fiction or tech articles to sharpen skills',
    icon: 'BookOpen',
    color: '#6366F1',
    scheduleType: 'DAILY',
    scheduleConfiguration: '{}',
    scheduleLabel: 'Every day',
    reminderTime: '21:00',
    archivedAt: null,
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    currentStreak: 14,
    longestStreak: 28,
    isScheduledToday: true,
    isCompletedToday: true,
    totalCompletions: 142,
  },
  {
    id: 'habit-code-weekdays',
    userId: DEMO_USER.id,
    name: 'Practice coding',
    description: 'Work on personal projects and algorithms',
    icon: 'Code',
    color: '#10B981',
    scheduleType: 'WEEKDAYS',
    scheduleConfiguration: JSON.stringify({ weekdays: [1, 3, 5] }),
    scheduleLabel: 'Mon, Wed, Fri',
    reminderTime: '18:30',
    archivedAt: null,
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    currentStreak: 6,
    longestStreak: 18,
    isScheduledToday: true,
    isCompletedToday: true,
    totalCompletions: 68,
  },
  {
    id: 'habit-exercise-weekly',
    userId: DEMO_USER.id,
    name: 'Exercise 3x per week',
    description: 'Gym workout, running, or swimming',
    icon: 'Dumbbell',
    color: '#F59E0B',
    scheduleType: 'TIMES_PER_WEEK',
    scheduleConfiguration: JSON.stringify({ targetPerWeek: 3 }),
    scheduleLabel: '3x per week',
    reminderTime: '07:30',
    archivedAt: null,
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    currentStreak: 8,
    longestStreak: 12,
    isScheduledToday: true,
    isCompletedToday: false,
    totalCompletions: 72,
  },
  {
    id: 'habit-learn-daily',
    userId: DEMO_USER.id,
    name: 'Learn a new concept',
    description: 'Explore new architectures, patterns, or tools daily',
    icon: 'Brain',
    color: '#EC4899',
    scheduleType: 'DAILY',
    scheduleConfiguration: '{}',
    scheduleLabel: 'Every day',
    reminderTime: '20:00',
    archivedAt: null,
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    currentStreak: 5,
    longestStreak: 15,
    isScheduledToday: true,
    isCompletedToday: false,
    totalCompletions: 110,
  },
  {
    id: 'habit-morning-jog',
    userId: DEMO_USER.id,
    name: 'Morning Jogging',
    description: 'Past summer habit, preserved with all history',
    icon: 'Flame',
    color: '#8B5CF6',
    scheduleType: 'DAILY',
    scheduleConfiguration: '{}',
    scheduleLabel: 'Every day',
    reminderTime: '06:30',
    archivedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    currentStreak: 0,
    longestStreak: 21,
    isScheduledToday: false,
    isCompletedToday: false,
    totalCompletions: 45,
  },
];

class ClientStore {
  private user: User | null = DEMO_USER;
  private habits: Habit[] = [...INITIAL_HABITS];
  private completions: Map<string, HabitCompletion> = new Map();

  constructor() {
    this.initCompletions();
  }

  private initCompletions() {
    const today = new Date().toISOString().split('T')[0];
    for (let offset = 180; offset >= 0; offset--) {
      const d = new Date(Date.now() - offset * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dow = d.getUTCDay() === 0 ? 7 : d.getUTCDay();

      // habit-read-daily
      if (offset <= 14 || (offset % 5 !== 0 && offset % 9 !== 0)) {
        this.addComp('habit-read-daily', dateStr);
      }
      // habit-code-weekdays (1, 3, 5)
      if ([1, 3, 5].includes(dow) && (offset <= 10 || offset % 7 !== 0)) {
        this.addComp('habit-code-weekdays', dateStr);
      }
      // habit-exercise-weekly (2, 4, 6)
      if ([2, 4, 6].includes(dow) && (offset <= 14 || offset % 4 !== 0)) {
        this.addComp('habit-exercise-weekly', dateStr);
      }
      // habit-learn-daily
      if (offset <= 5 || offset % 3 !== 0) {
        this.addComp('habit-learn-daily', dateStr);
      }
    }
  }

  private addComp(habitId: string, localDate: string) {
    const key = `${habitId}:${localDate}`;
    this.completions.set(key, {
      id: `comp-${key}`,
      habitId,
      localDate,
      completedAt: new Date().toISOString(),
    });
  }

  getUser() {
    return this.user;
  }

  login(email: string) {
    this.user = { ...DEMO_USER, email };
    return this.user;
  }

  logout() {
    this.user = null;
  }

  getHabits(archived = false): Habit[] {
    return this.habits.filter((h) => (archived ? h.archivedAt !== null : h.archivedAt === null));
  }

  getHabit(id: string): Habit | undefined {
    return this.habits.find((h) => h.id === id);
  }

  createHabit(data: any): Habit {
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      userId: this.user?.id || 'demo-user-alex',
      name: data.name,
      description: data.description || null,
      icon: data.icon || 'Target',
      color: data.color || '#6366F1',
      scheduleType: data.scheduleType,
      scheduleConfiguration:
        typeof data.scheduleConfiguration === 'object'
          ? JSON.stringify(data.scheduleConfiguration)
          : data.scheduleConfiguration || '{}',
      scheduleLabel: data.scheduleType === 'DAILY' ? 'Every day' : 'Custom',
      reminderTime: data.reminderTime || null,
      archivedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStreak: 0,
      longestStreak: 0,
      isScheduledToday: true,
      isCompletedToday: false,
      totalCompletions: 0,
    };
    this.habits.unshift(newHabit);
    return newHabit;
  }

  updateHabit(id: string, data: any): Habit | undefined {
    const habit = this.getHabit(id);
    if (!habit) return undefined;
    Object.assign(habit, data);
    habit.updatedAt = new Date().toISOString();
    return habit;
  }

  archiveHabit(id: string): Habit | undefined {
    const habit = this.getHabit(id);
    if (!habit) return undefined;
    habit.archivedAt = new Date().toISOString();
    return habit;
  }

  restoreHabit(id: string): Habit | undefined {
    const habit = this.getHabit(id);
    if (!habit) return undefined;
    habit.archivedAt = null;
    return habit;
  }

  deleteHabit(id: string): boolean {
    const idx = this.habits.findIndex((h) => h.id === id);
    if (idx !== -1) {
      this.habits.splice(idx, 1);
      return true;
    }
    return false;
  }

  setCompletion(habitId: string, date: string) {
    this.addComp(habitId, date);
    const habit = this.getHabit(habitId);
    if (habit) {
      habit.isCompletedToday = true;
      habit.currentStreak = (habit.currentStreak || 0) + 1;
    }
  }

  removeCompletion(habitId: string, date: string) {
    this.completions.delete(`${habitId}:${date}`);
    const habit = this.getHabit(habitId);
    if (habit) {
      habit.isCompletedToday = false;
      habit.currentStreak = Math.max(0, (habit.currentStreak || 1) - 1);
    }
  }

  getDashboardData(): DashboardData {
    const active = this.getHabits(false);
    const today = new Date().toISOString().split('T')[0];
    const completedCount = active.filter((h) => h.isCompletedToday).length;
    const scheduledCount = active.length;
    const pct = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;

    return {
      user: this.user || DEMO_USER,
      todayLocalDate: today,
      totalActiveHabits: active.length,
      scheduledTodayCount: scheduledCount,
      completedTodayCount: completedCount,
      todayCompletionPercentage: pct,
      currentStreakHighlight: { habitName: 'Read 20 minutes', streak: 14, icon: 'BookOpen' },
      longestStreakHighlight: { habitName: 'Read 20 minutes', streak: 28, icon: 'Trophy' },
      motivationalMessage:
        pct === 100
          ? 'Outstanding! You completed all scheduled habits today! 🚀'
          : 'Great momentum! Keep your streaks alive today! 🔥',
      weeklyActivity: [
        { date: '2026-10-22', dayLabel: 'Thu', completed: 3, totalScheduled: 4 },
        { date: '2026-10-23', dayLabel: 'Fri', completed: 4, totalScheduled: 4 },
        { date: '2026-10-24', dayLabel: 'Sat', completed: 2, totalScheduled: 3 },
        { date: '2026-10-25', dayLabel: 'Sun', completed: 2, totalScheduled: 2 },
        { date: '2026-10-26', dayLabel: 'Mon', completed: 4, totalScheduled: 4 },
        { date: '2026-10-27', dayLabel: 'Tue', completed: 3, totalScheduled: 3 },
        { date: today, dayLabel: 'Today', completed: completedCount, totalScheduled: scheduledCount },
      ],
      todayHabits: active.map((h) => ({
        id: h.id,
        name: h.name,
        description: h.description,
        icon: h.icon,
        color: h.color,
        scheduleType: h.scheduleType,
        scheduleLabel: h.scheduleLabel || 'Every day',
        isScheduledToday: true,
        isCompletedToday: h.isCompletedToday || false,
        currentStreak: h.currentStreak || 0,
        longestStreak: h.longestStreak || 0,
        canToggle: true,
      })),
    };
  }

  getHeatmap(habitId: string): HeatmapResponse {
    const habit = this.getHabit(habitId) || this.habits[0];
    const today = new Date().toISOString().split('T')[0];
    const days: any[] = [];
    const totalDays = 26 * 7;
    let completed = 0;
    let scheduled = 0;

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dow = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
      const isFuture = dateStr > today;
      const isDone = this.completions.has(`${habitId}:${dateStr}`);
      const isSched = habit.scheduleType === 'DAILY' || (habit.scheduleType === 'WEEKDAYS' ? [1, 3, 5].includes(dow) : true);

      let status = 'unscheduled';
      if (isFuture) status = 'future';
      else if (isDone) {
        status = 'completed';
        completed++;
      } else if (isSched) {
        status = 'missed';
      }

      if (!isFuture && isSched) scheduled++;

      days.push({
        date: dateStr,
        dayOfWeek: dow,
        month: d.toLocaleString('en', { month: 'short' }),
        isScheduled: isSched,
        isCompleted: isDone,
        isMissed: status === 'missed',
        isFuture,
        status,
      });
    }

    return {
      habitId: habit.id,
      habitName: habit.name,
      habitColor: habit.color,
      habitIcon: habit.icon,
      scheduleType: habit.scheduleType,
      scheduleLabel: habit.scheduleLabel || 'Every day',
      today,
      totalCompleted: completed,
      totalScheduled: scheduled,
      days,
    };
  }

  getStats(): StatsResponse {
    const today = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];

    const active = this.getHabits(false);
    let totalDone = 0;
    let totalEligible = 0;

    const perHabit = active.map((h) => {
      const eligible = h.scheduleType === 'DAILY' ? 30 : h.scheduleType === 'WEEKDAYS' ? 13 : 13;
      const done = Math.round(eligible * 0.85);
      totalDone += done;
      totalEligible += eligible;
      const rate = Math.round((done / eligible) * 100);

      return {
        habitId: h.id,
        habitName: h.name,
        habitColor: h.color,
        habitIcon: h.icon,
        scheduleType: h.scheduleType,
        scheduleLabel: h.scheduleLabel || 'Daily',
        currentStreak: h.currentStreak || 0,
        longestStreak: h.longestStreak || 0,
        completedCount: done,
        eligibleCount: eligible,
        missedCount: eligible - done,
        completionRate: rate,
      };
    });

    const overallRate = totalEligible > 0 ? Math.round((totalDone / totalEligible) * 100) : 0;

    const dailyActivity = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dailyActivity.push({
        date: d.toISOString().split('T')[0],
        dayLabel: dayNames[d.getDay()],
        completedCount: Math.floor(Math.random() * 2) + 2,
      });
    }

    return {
      range: { startDate, endDate: today },
      overall: {
        totalCompleted: totalDone,
        totalEligible: totalEligible,
        completionRate: overallRate,
      },
      dailyActivity,
      perHabit,
      today,
    };
  }
}

export const clientStore = new ClientStore();
