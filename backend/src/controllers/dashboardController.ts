import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { habitRepository, completionRepository } from '../db/store';
import { getUserToday, addDaysToDateString, getDayOfWeek } from '../utils/dateUtils';
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  getScheduleLabel,
  isHabitScheduledOnDate,
} from '../services/scheduleEngine';

export const dashboardController = {
  async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const today = getUserToday(user.timezone);

      // Fetch active habits only
      const habits = await habitRepository.findByUserId(user.id, false);
      const habitIds = habits.map((h) => h.id);
      const completionsMap = await completionRepository.findForHabits(habitIds);

      let scheduledTodayCount = 0;
      let completedTodayCount = 0;
      let highestCurrentStreak = { habitName: '', streak: 0, icon: 'Flame' };
      let highestLongestStreak = { habitName: '', streak: 0, icon: 'Trophy' };

      const todayHabits = habits.map((h) => {
        const completions = completionsMap[h.id] || [];
        const completionSet = new Set(completions);
        const isScheduledToday = isHabitScheduledOnDate(
          h.scheduleType,
          h.scheduleConfiguration,
          today
        );
        const isCompletedToday = completionSet.has(today);
        const currentStreak = calculateCurrentStreak(h, completions, today);
        const longestStreak = calculateLongestStreak(h, completions, today);
        const scheduleLabel = getScheduleLabel(h.scheduleType, h.scheduleConfiguration);

        if (isScheduledToday) {
          scheduledTodayCount++;
          if (isCompletedToday) {
            completedTodayCount++;
          }
        }

        if (currentStreak > highestCurrentStreak.streak) {
          highestCurrentStreak = { habitName: h.name, streak: currentStreak, icon: h.icon };
        }

        if (longestStreak > highestLongestStreak.streak) {
          highestLongestStreak = { habitName: h.name, streak: longestStreak, icon: h.icon };
        }

        return {
          id: h.id,
          name: h.name,
          description: h.description,
          icon: h.icon,
          color: h.color,
          scheduleType: h.scheduleType,
          scheduleLabel,
          isScheduledToday,
          isCompletedToday,
          currentStreak,
          longestStreak,
          canToggle: true,
        };
      });

      // Today completion percentage (safe from zero division)
      const todayCompletionPercentage =
        scheduledTodayCount > 0
          ? Math.round((completedTodayCount / scheduledTodayCount) * 100)
          : 0;

      // Motivational message
      let motivationalMessage =
        'Ready to build consistency? Complete your scheduled habits today!';
      if (scheduledTodayCount === 0) {
        motivationalMessage = 'No habits scheduled for today. Enjoy your restful day or plan ahead!';
      } else if (todayCompletionPercentage === 100) {
        motivationalMessage =
          'Outstanding work! You crushed all your scheduled habits today. Keep the streak alive! 🚀';
      } else if (todayCompletionPercentage >= 50) {
        motivationalMessage =
          'Great momentum! Over halfway through today’s goals. Finish strong! 💪';
      } else if (todayCompletionPercentage > 0) {
        motivationalMessage =
          'Off to a solid start! Check off your remaining habits to keep your streaks! 🔥';
      }

      // Weekly activity summary (last 7 days: today - 6 to today)
      const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyActivity: {
        date: string;
        dayLabel: string;
        completed: number;
        totalScheduled: number;
      }[] = [];

      for (let offset = 6; offset >= 0; offset--) {
        const d = addDaysToDateString(today, -offset);
        let completedOnDay = 0;
        let scheduledOnDay = 0;

        for (const h of habits) {
          const completions = completionsMap[h.id] || [];
          const isSched = isHabitScheduledOnDate(h.scheduleType, h.scheduleConfiguration, d);
          if (isSched) {
            scheduledOnDay++;
            if (completions.includes(d)) {
              completedOnDay++;
            }
          }
        }

        weeklyActivity.push({
          date: d,
          dayLabel: dayNames[getDayOfWeek(d)],
          completed: completedOnDay,
          totalScheduled: scheduledOnDay,
        });
      }

      res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          timezone: user.timezone,
        },
        todayLocalDate: today,
        totalActiveHabits: habits.length,
        scheduledTodayCount,
        completedTodayCount,
        todayCompletionPercentage,
        currentStreakHighlight:
          highestCurrentStreak.streak > 0 ? highestCurrentStreak : null,
        longestStreakHighlight:
          highestLongestStreak.streak > 0 ? highestLongestStreak : null,
        motivationalMessage,
        weeklyActivity,
        todayHabits,
      });
    } catch (err: any) {
      console.error('Error in getDashboard:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
