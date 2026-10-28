import {
  ScheduleType,
  WeekdaysConfig,
  TimesPerWeekConfig,
  HeatmapDay,
  HabitStats,
} from '../types';
import {
  getDayOfWeek,
  addDaysToDateString,
  diffInDays,
  getStartOfWeek,
  getEndOfWeek,
  getDateRange,
  getShortMonthName,
} from '../utils/dateUtils';

export interface HabitScheduleInput {
  id: string;
  name: string;
  color: string;
  icon: string;
  scheduleType: ScheduleType;
  scheduleConfiguration: string; // JSON string
  createdAt: Date | string;
}

/**
 * Parse scheduleConfiguration string safely with fallbacks.
 */
export function parseScheduleConfig(
  scheduleType: ScheduleType,
  rawConfig: string | object | null | undefined
): WeekdaysConfig | TimesPerWeekConfig | Record<string, never> {
  let parsed: any = {};
  if (typeof rawConfig === 'string') {
    try {
      parsed = JSON.parse(rawConfig);
    } catch {
      parsed = {};
    }
  } else if (typeof rawConfig === 'object' && rawConfig !== null) {
    parsed = rawConfig;
  }

  if (scheduleType === 'WEEKDAYS') {
    const weekdays = Array.isArray(parsed?.weekdays)
      ? parsed.weekdays.filter((d: any) => typeof d === 'number' && d >= 1 && d <= 7)
      : [1, 2, 3, 4, 5]; // Default to Mon-Fri if empty
    return { weekdays: weekdays.length > 0 ? weekdays : [1, 2, 3, 4, 5] };
  }

  if (scheduleType === 'TIMES_PER_WEEK') {
    const target = Number(parsed?.targetPerWeek);
    const targetPerWeek = !isNaN(target) && target >= 1 && target <= 7 ? target : 3;
    return { targetPerWeek };
  }

  return {};
}

/**
 * Generate human-friendly schedule label.
 */
export function getScheduleLabel(
  scheduleType: ScheduleType,
  rawConfig: string | object | null | undefined
): string {
  const config = parseScheduleConfig(scheduleType, rawConfig);
  if (scheduleType === 'DAILY') {
    return 'Every day';
  }

  if (scheduleType === 'WEEKDAYS') {
    const weekdays = (config as WeekdaysConfig).weekdays || [];
    const dayNames: Record<number, string> = {
      1: 'Mon',
      2: 'Tue',
      3: 'Wed',
      4: 'Thu',
      5: 'Fri',
      6: 'Sat',
      7: 'Sun',
    };
    if (weekdays.length === 5 && weekdays.every((d, i) => d === i + 1)) {
      return 'Weekdays (Mon-Fri)';
    }
    if (weekdays.length === 2 && weekdays.includes(6) && weekdays.includes(7)) {
      return 'Weekends (Sat-Sun)';
    }
    return weekdays.map((d) => dayNames[d] || d).join(', ');
  }

  if (scheduleType === 'TIMES_PER_WEEK') {
    const target = (config as TimesPerWeekConfig).targetPerWeek || 3;
    return `${target}x per week`;
  }

  return 'Custom';
}

/**
 * Determine whether a habit is scheduled on a given local calendar date (YYYY-MM-DD).
 */
export function isHabitScheduledOnDate(
  scheduleType: ScheduleType,
  rawConfig: string | object | null | undefined,
  dateStr: string
): boolean {
  if (scheduleType === 'DAILY') {
    return true;
  }

  const config = parseScheduleConfig(scheduleType, rawConfig);

  if (scheduleType === 'WEEKDAYS') {
    const weekdays = (config as WeekdaysConfig).weekdays || [];
    const dayOfWeek = getDayOfWeek(dateStr);
    return weekdays.includes(dayOfWeek);
  }

  if (scheduleType === 'TIMES_PER_WEEK') {
    // For times-per-week habits, any day is an eligible candidate to record a completion.
    return true;
  }

  return true;
}

/**
 * Calculate Current Streak for a habit.
 *
 * Rules:
 * - DAILY & WEEKDAYS:
 *   Walk backwards through scheduled days starting from today (or the previous scheduled day if today is unscheduled).
 *   - If today is scheduled and completed: counts + continues backwards.
 *   - If today is scheduled and NOT completed: today is still in progress, so do not break streak!
 *     Start evaluation from previous scheduled day.
 *   - If today is not a scheduled day: start evaluation from the most recent prior scheduled day.
 *   - For past scheduled days: any missed scheduled day breaks the consecutive streak.
 *
 * - TIMES_PER_WEEK:
 *   - Mon-Sun calendar weeks.
 *   - If current week target achieved: counts current week + consecutive past qualifying weeks.
 *   - If current week in progress and target NOT yet met: streak equals consecutive past qualifying weeks.
 *     (Unfinished current week is NOT prematurely failed).
 *   - If past week did not achieve target: streak breaks.
 */
export function calculateCurrentStreak(
  habit: {
    scheduleType: ScheduleType;
    scheduleConfiguration: string | object;
    createdAt?: Date | string;
  },
  completions: string[], // array of YYYY-MM-DD
  today: string // user's local today YYYY-MM-DD
): number {
  const completionSet = new Set(completions);
  const { scheduleType, scheduleConfiguration } = habit;
  const config = parseScheduleConfig(scheduleType, scheduleConfiguration);

  if (scheduleType === 'TIMES_PER_WEEK') {
    return calculateWeeklyCurrentStreak(config as TimesPerWeekConfig, completionSet, today);
  }

  // DAILY or WEEKDAYS
  let streak = 0;
  const isTodayScheduled = isHabitScheduledOnDate(scheduleType, config, today);
  const isTodayCompleted = completionSet.has(today);

  // Determine starting point
  let checkDate: string;
  if (isTodayScheduled) {
    if (isTodayCompleted) {
      streak += 1;
      checkDate = addDaysToDateString(today, -1);
    } else {
      // Today is scheduled but not completed. It is in progress.
      // Check from yesterday backwards.
      checkDate = addDaysToDateString(today, -1);
    }
  } else {
    // Today is not a scheduled day (e.g. Tue for Mon/Wed/Fri)
    // Check backwards from yesterday
    checkDate = addDaysToDateString(today, -1);
  }

  // Walk backwards up to 365 days or until broken
  for (let i = 0; i < 365; i++) {
    const isScheduled = isHabitScheduledOnDate(scheduleType, config, checkDate);
    if (isScheduled) {
      if (completionSet.has(checkDate)) {
        streak += 1;
      } else {
        // Missed scheduled day in the past breaks streak
        break;
      }
    }
    // If not scheduled (e.g. weekend or non-scheduled weekday), skip without breaking streak
    checkDate = addDaysToDateString(checkDate, -1);
  }

  return streak;
}

/**
 * Current streak calculation for weekly frequency habits.
 */
function calculateWeeklyCurrentStreak(
  config: TimesPerWeekConfig,
  completionSet: Set<string>,
  today: string
): number {
  const target = config.targetPerWeek || 3;
  const currentWeekStart = getStartOfWeek(today);
  const currentWeekEnd = getEndOfWeek(today);

  // Count completions in current week (up to today or end of week)
  let currentWeekCount = 0;
  let curr = currentWeekStart;
  while (diffInDays(currentWeekEnd, curr) >= 0) {
    if (completionSet.has(curr)) {
      currentWeekCount++;
    }
    curr = addDaysToDateString(curr, 1);
  }

  const currentWeekMet = currentWeekCount >= target;

  // Now count past consecutive completed weeks
  let pastConsecutiveWeeks = 0;
  let prevWeekStart = addDaysToDateString(currentWeekStart, -7);

  for (let w = 0; w < 52; w++) {
    let weekCount = 0;
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dayDate = addDaysToDateString(prevWeekStart, dayOffset);
      if (completionSet.has(dayDate)) {
        weekCount++;
      }
    }

    if (weekCount >= target) {
      pastConsecutiveWeeks++;
      prevWeekStart = addDaysToDateString(prevWeekStart, -7);
    } else {
      // Historical week missed target -> breaks streak
      break;
    }
  }

  if (currentWeekMet) {
    return 1 + pastConsecutiveWeeks;
  } else {
    // Current week is unfinished and target not yet met -> streak equals past consecutive weeks
    return pastConsecutiveWeeks;
  }
}

/**
 * Calculate Longest Streak for a habit over its entire history up to today.
 */
export function calculateLongestStreak(
  habit: {
    scheduleType: ScheduleType;
    scheduleConfiguration: string | object;
    createdAt?: Date | string;
  },
  completions: string[],
  today: string
): number {
  const completionSet = new Set(completions);
  if (completionSet.size === 0) return 0;

  const { scheduleType, scheduleConfiguration } = habit;
  const config = parseScheduleConfig(scheduleType, scheduleConfiguration);

  if (scheduleType === 'TIMES_PER_WEEK') {
    return calculateWeeklyLongestStreak(config as TimesPerWeekConfig, completionSet, today);
  }

  // Find the earliest date to start checking
  const allDates = Array.from(completionSet).sort();
  const earliestDate = allDates[0];
  if (!earliestDate || diffInDays(today, earliestDate) < 0) return 0;

  let maxStreak = 0;
  let currentStreak = 0;

  const dateRange = getDateRange(earliestDate, today);

  for (let i = 0; i < dateRange.length; i++) {
    const date = dateRange[i];
    const isScheduled = isHabitScheduledOnDate(scheduleType, config, date);
    if (!isScheduled) {
      continue; // Skip unscheduled day without affecting streak count
    }

    const isCompleted = completionSet.has(date);
    if (isCompleted) {
      currentStreak += 1;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      // If date is today, incomplete doesn't retroactively reduce previous max streak
      if (date !== today) {
        currentStreak = 0;
      }
    }
  }

  return maxStreak;
}

/**
 * Longest streak calculation for weekly frequency habits.
 */
function calculateWeeklyLongestStreak(
  config: TimesPerWeekConfig,
  completionSet: Set<string>,
  today: string
): number {
  if (completionSet.size === 0) return 0;
  const target = config.targetPerWeek || 3;
  const allDates = Array.from(completionSet).sort();
  const earliestWeekStart = getStartOfWeek(allDates[0]);
  const currentWeekStart = getStartOfWeek(today);

  let maxStreak = 0;
  let currentStreak = 0;
  let iterWeekStart = earliestWeekStart;

  while (diffInDays(currentWeekStart, iterWeekStart) >= 0) {
    let weekCount = 0;
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dayDate = addDaysToDateString(iterWeekStart, dayOffset);
      if (completionSet.has(dayDate)) {
        weekCount++;
      }
    }

    const isMet = weekCount >= target;
    const isCurrentWeek = iterWeekStart === currentWeekStart;

    if (isMet) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      if (!isCurrentWeek) {
        currentStreak = 0;
      }
    }

    iterWeekStart = addDaysToDateString(iterWeekStart, 7);
  }

  return maxStreak;
}

/**
 * Build 6-Month Heatmap dataset (approx 180 days up to today).
 * Properly aligns with weeks (Mon-Sun) and labels months.
 */
export function buildHeatmapData(
  habit: {
    scheduleType: ScheduleType;
    scheduleConfiguration: string | object;
  },
  completions: string[],
  today: string,
  months: number = 6
): { days: HeatmapDay[]; totalCompleted: number; totalScheduled: number } {
  const completionSet = new Set(completions);
  const config = parseScheduleConfig(habit.scheduleType, habit.scheduleConfiguration);

  // We show 26 weeks (~6 months) ending on the current week's Sunday
  const endOfWeek = getEndOfWeek(today);
  const totalDays = 26 * 7; // 182 days
  const startDate = addDaysToDateString(endOfWeek, -(totalDays - 1));

  const allDates = getDateRange(startDate, endOfWeek);
  const days: HeatmapDay[] = [];
  let totalCompleted = 0;
  let totalScheduled = 0;

  for (const date of allDates) {
    const isFuture = diffInDays(date, today) > 0;
    const isScheduled = isHabitScheduledOnDate(habit.scheduleType, config, date);
    const isCompleted = completionSet.has(date);
    const isMissed = !isFuture && isScheduled && !isCompleted && diffInDays(today, date) > 0;

    let status: 'completed' | 'missed' | 'unscheduled' | 'future';
    if (isFuture) {
      status = 'future';
    } else if (isCompleted) {
      status = 'completed';
      totalCompleted++;
    } else if (isScheduled) {
      status = 'missed';
    } else {
      status = 'unscheduled';
    }

    if (!isFuture && isScheduled) {
      totalScheduled++;
    }

    days.push({
      date,
      dayOfWeek: getDayOfWeek(date),
      month: getShortMonthName(date),
      isScheduled,
      isCompleted,
      isMissed,
      isFuture,
      status,
    });
  }

  return { days, totalCompleted, totalScheduled };
}

/**
 * Calculate 30-Day completion statistics for habits.
 * Date range: [today - 29 days, today] (30 calendar days inclusive).
 */
export function calculate30DayStats(
  habits: HabitScheduleInput[],
  completionsMap: Record<string, string[]>, // habitId -> list of completed dates
  today: string
): {
  range: { startDate: string; endDate: string };
  overall: {
    totalCompleted: number;
    totalEligible: number;
    completionRate: number; // 0 to 100 percentage
  };
  dailyActivity: { date: string; dayLabel: string; completedCount: number }[];
  perHabit: HabitStats[];
} {
  const startDate = addDaysToDateString(today, -29);
  const dateRange = getDateRange(startDate, today);

  const dailyActivityMap: Record<string, number> = {};
  for (const d of dateRange) {
    dailyActivityMap[d] = 0;
  }

  let overallCompleted = 0;
  let overallEligible = 0;

  const perHabit: HabitStats[] = habits.map((h) => {
    const completions = completionsMap[h.id] || [];
    const completionSet = new Set(completions);
    const config = parseScheduleConfig(h.scheduleType, h.scheduleConfiguration);
    const scheduleLabel = getScheduleLabel(h.scheduleType, h.scheduleConfiguration);

    let completedCount = 0;
    let eligibleCount = 0;

    if (h.scheduleType === 'TIMES_PER_WEEK') {
      const target = (config as TimesPerWeekConfig).targetPerWeek || 3;
      // In 30 days, expected target is proportional: (target / 7) * 30
      eligibleCount = Math.round((target / 7) * 30);
      for (const d of dateRange) {
        if (completionSet.has(d)) {
          completedCount++;
          dailyActivityMap[d] = (dailyActivityMap[d] || 0) + 1;
        }
      }
    } else {
      // DAILY or WEEKDAYS
      for (const d of dateRange) {
        const isScheduled = isHabitScheduledOnDate(h.scheduleType, config, d);
        if (isScheduled) {
          eligibleCount++;
          if (completionSet.has(d)) {
            completedCount++;
            dailyActivityMap[d] = (dailyActivityMap[d] || 0) + 1;
          }
        }
      }
    }

    const missedCount = Math.max(0, eligibleCount - completedCount);
    // Completion Rate formula: safe from division by zero
    const completionRate =
      eligibleCount > 0 ? Math.min(100, Math.round((completedCount / eligibleCount) * 100)) : 0;

    overallCompleted += completedCount;
    overallEligible += eligibleCount;

    const currentStreak = calculateCurrentStreak(h, completions, today);
    const longestStreak = calculateLongestStreak(h, completions, today);

    return {
      habitId: h.id,
      habitName: h.name,
      habitColor: h.color,
      habitIcon: h.icon,
      scheduleType: h.scheduleType,
      scheduleLabel,
      currentStreak,
      longestStreak,
      completedCount,
      eligibleCount,
      missedCount,
      completionRate,
    };
  });

  const overallRate =
    overallEligible > 0 ? Math.min(100, Math.round((overallCompleted / overallEligible) * 100)) : 0;

  const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyActivity = dateRange.map((d) => ({
    date: d,
    dayLabel: dayNames[getDayOfWeek(d)],
    completedCount: dailyActivityMap[d] || 0,
  }));

  return {
    range: { startDate, endDate: today },
    overall: {
      totalCompleted: overallCompleted,
      totalEligible: overallEligible,
      completionRate: overallRate,
    },
    dailyActivity,
    perHabit,
  };
}
