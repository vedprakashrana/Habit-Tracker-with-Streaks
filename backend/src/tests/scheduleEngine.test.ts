import { describe, it, expect } from 'vitest';
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  isHabitScheduledOnDate,
  parseScheduleConfig,
  getScheduleLabel,
  buildHeatmapData,
  calculate30DayStats,
} from '../services/scheduleEngine';
import {
  isValidISODateString,
  validateCorrectionWindow,
  getUserToday,
  addDaysToDateString,
  diffInDays,
  getDayOfWeek,
  getStartOfWeek,
  getEndOfWeek,
  isLeapYear,
} from '../utils/dateUtils';

describe('Schedule Engine & Date Utils', () => {
  // Scenario 1: A daily habit completed on consecutive days produces the correct current streak
  it('1. Daily habit completed on consecutive days produces the correct current streak', () => {
    const habit = {
      scheduleType: 'DAILY' as const,
      scheduleConfiguration: '{}',
    };
    const today = '2026-10-28';
    // Completed today, yesterday, and 2 days ago
    const completions = ['2026-10-28', '2026-10-27', '2026-10-26'];
    const streak = calculateCurrentStreak(habit, completions, today);
    expect(streak).toBe(3);
  });

  // Scenario 2: A missed scheduled day breaks a daily streak
  it('2. A missed scheduled day breaks a daily streak', () => {
    const habit = {
      scheduleType: 'DAILY' as const,
      scheduleConfiguration: '{}',
    };
    const today = '2026-10-28';
    // Completed today, skipped yesterday (2026-10-27), completed 2026-10-26
    const completions = ['2026-10-28', '2026-10-26'];
    const streak = calculateCurrentStreak(habit, completions, today);
    // Since yesterday was missed, streak is just 1 (today)
    expect(streak).toBe(1);
  });

  // Scenario 3: A Monday/Wednesday/Friday habit does not lose its streak on Tuesday
  it('3. A Monday/Wednesday/Friday habit does not lose its streak on Tuesday', () => {
    const habit = {
      scheduleType: 'WEEKDAYS' as const,
      // 1=Mon, 3=Wed, 5=Fri
      scheduleConfiguration: JSON.stringify({ weekdays: [1, 3, 5] }),
    };
    // Suppose today is Tuesday 2026-10-27 (getDayOfWeek = 2)
    const todayTuesday = '2026-10-27';
    expect(getDayOfWeek(todayTuesday)).toBe(2);

    // Completed on Monday 2026-10-26
    const completions = ['2026-10-26'];
    const streak = calculateCurrentStreak(habit, completions, todayTuesday);

    // Tuesday is unscheduled, so streak through Monday should remain 1!
    expect(streak).toBe(1);
  });

  // Scenario 4: A missing scheduled Friday breaks the appropriate historical streak
  it('4. A missing scheduled Friday breaks the appropriate historical streak', () => {
    const habit = {
      scheduleType: 'WEEKDAYS' as const,
      scheduleConfiguration: JSON.stringify({ weekdays: [1, 3, 5] }),
    };
    // Suppose today is Monday 2026-10-26.
    // Previous scheduled days were: Friday 2026-10-23, Wednesday 2026-10-21.
    // User completed today (Mon) and Wednesday 2026-10-21, but missed Friday 2026-10-23.
    const todayMonday = '2026-10-26';
    const completions = ['2026-10-26', '2026-10-21']; // Missed 2026-10-23 (Fri)
    const streak = calculateCurrentStreak(habit, completions, todayMonday);

    // Friday was missed, so streak is only 1 (today Monday)
    expect(streak).toBe(1);
  });

  // Scenario 5: Longest streak is calculated correctly
  it('5. Longest streak is calculated correctly across historical records', () => {
    const habit = {
      scheduleType: 'DAILY' as const,
      scheduleConfiguration: '{}',
    };
    const today = '2026-10-28';
    // Two runs: 4-day run earlier, then a miss, then 2-day current run
    const completions = [
      '2026-10-10',
      '2026-10-11',
      '2026-10-12',
      '2026-10-13', // 4-day run
      // Missed 2026-10-14 through 2026-10-26
      '2026-10-27',
      '2026-10-28', // 2-day run
    ];
    const currentStreak = calculateCurrentStreak(habit, completions, today);
    const longestStreak = calculateLongestStreak(habit, completions, today);

    expect(currentStreak).toBe(2);
    expect(longestStreak).toBe(4);
  });

  // Scenario 6: A weekly-target habit meets its configured weekly target
  it('6. A weekly-target habit meets its configured weekly target', () => {
    const habit = {
      scheduleType: 'TIMES_PER_WEEK' as const,
      scheduleConfiguration: JSON.stringify({ targetPerWeek: 3 }),
    };
    // Monday of current week: 2026-10-26
    const today = '2026-10-28'; // Wednesday
    const completions = ['2026-10-26', '2026-10-27', '2026-10-28']; // 3 completions

    const streak = calculateCurrentStreak(habit, completions, today);
    expect(streak).toBe(1);
  });

  // Scenario 7: An unfinished current week is not prematurely marked as failed
  it('7. An unfinished current week is not prematurely marked as failed', () => {
    const habit = {
      scheduleType: 'TIMES_PER_WEEK' as const,
      scheduleConfiguration: JSON.stringify({ targetPerWeek: 3 }),
    };
    // Today is Tuesday 2026-10-27
    const today = '2026-10-27';
    // Last week (starts 2026-10-19) had 3 completions: met target!
    // Current week has only 1 completion so far (not yet met, but week is unfinished)
    const completions = [
      '2026-10-19',
      '2026-10-21',
      '2026-10-23', // Last week met (3 times)
      '2026-10-26', // Current week (1 time so far)
    ];

    const streak = calculateCurrentStreak(habit, completions, today);
    // Should preserve the streak of 1 from the successfully completed prior week
    expect(streak).toBe(1);
  });

  // Scenario 8: Today pending scheduled day does not break active streak
  it('8. A scheduled day that is not yet completed today does not break active streak', () => {
    const habit = {
      scheduleType: 'DAILY' as const,
      scheduleConfiguration: '{}',
    };
    const today = '2026-10-28';
    // Completed yesterday and day before, but not yet completed today
    const completions = ['2026-10-27', '2026-10-26'];
    const streak = calculateCurrentStreak(habit, completions, today);
    // Streak from prior days is intact because today is still in progress
    expect(streak).toBe(2);
  });

  // Scenario 9: 7-day correction window validates correctly
  it('9. 7-day correction window accepts valid dates within past 7 days', () => {
    const today = '2026-10-28';
    expect(validateCorrectionWindow('2026-10-28', today).valid).toBe(true);
    expect(validateCorrectionWindow('2026-10-27', today).valid).toBe(true);
    expect(validateCorrectionWindow('2026-10-21', today).valid).toBe(true); // exactly 7 days
  });

  // Scenario 10: Invalid date strings are rejected
  it('10. Invalid dates are rejected by format and calendar validity', () => {
    expect(isValidISODateString('2026-13-01')).toBe(false); // month 13
    expect(isValidISODateString('2026-02-30')).toBe(false); // Feb 30
    expect(isValidISODateString('2026-04-31')).toBe(false); // Apr 31
    expect(isValidISODateString('not-a-date')).toBe(false);
    expect(isValidISODateString('')).toBe(false);
  });

  // Scenario 11: Future completion dates are rejected
  it('11. Future completion dates are rejected', () => {
    const today = '2026-10-28';
    const tomorrow = '2026-10-29';
    const validation = validateCorrectionWindow(tomorrow, today);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('Future completion dates');
  });

  // Scenario 12: Dates older than 7 days are rejected
  it('12. Dates older than 7 calendar days are rejected', () => {
    const today = '2026-10-28';
    const eightDaysAgo = '2026-10-20';
    const validation = validateCorrectionWindow(eightDaysAgo, today);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('older than 7 calendar days');
  });

  // Scenario 13: Invalid schedule configuration is safely handled
  it('13. Invalid schedule configuration defaults safely', () => {
    const badWeekdays = parseScheduleConfig('WEEKDAYS', '{"weekdays": [99, -1]}');
    expect((badWeekdays as any).weekdays).toEqual([1, 2, 3, 4, 5]);

    const badWeekly = parseScheduleConfig('TIMES_PER_WEEK', '{"targetPerWeek": 100}');
    expect((badWeekly as any).targetPerWeek).toBe(3);

    const malformedJson = parseScheduleConfig('WEEKDAYS', 'invalid json string');
    expect((malformedJson as any).weekdays).toEqual([1, 2, 3, 4, 5]);
  });

  // Scenario 14: Timezone conversions and boundary dates work properly
  it('14. Timezone-sensitive date calculations and leap years behave correctly', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);

    // Leap year Feb 29
    expect(isValidISODateString('2024-02-29')).toBe(true);
    expect(isValidISODateString('2026-02-29')).toBe(false);

    // Month boundary addition
    expect(addDaysToDateString('2026-10-31', 1)).toBe('2026-11-01');
    // Year boundary addition
    expect(addDaysToDateString('2026-12-31', 1)).toBe('2027-01-01');

    // Week boundaries: Monday through Sunday
    expect(getStartOfWeek('2026-10-28')).toBe('2026-10-26');
    expect(getEndOfWeek('2026-10-28')).toBe('2026-11-01');
  });

  // Scenario 15: Zero denominator and empty history in statistics
  it('15. Statistics handles empty habits and zero denominators gracefully without NaN', () => {
    const today = '2026-10-28';
    const stats = calculate30DayStats([], {}, today);
    expect(stats.overall.completionRate).toBe(0);
    expect(isNaN(stats.overall.completionRate)).toBe(false);
    expect(stats.perHabit.length).toBe(0);
  });

  // Scenario 16: Heatmap generation produces 182 cells with correct statuses
  it('16. Heatmap generation produces correct statuses and distinguishes future days', () => {
    const habit = {
      scheduleType: 'DAILY' as const,
      scheduleConfiguration: '{}',
    };
    const today = '2026-10-28';
    const completions = ['2026-10-28', '2026-10-27'];
    const heatmap = buildHeatmapData(habit, completions, today);

    expect(heatmap.days.length).toBe(182); // 26 full weeks
    const todayCell = heatmap.days.find((d) => d.date === today);
    expect(todayCell).toBeDefined();
    expect(todayCell?.status).toBe('completed');

    const futureCell = heatmap.days.find((d) => d.date > today);
    expect(futureCell).toBeDefined();
    expect(futureCell?.status).toBe('future');
  });
});
