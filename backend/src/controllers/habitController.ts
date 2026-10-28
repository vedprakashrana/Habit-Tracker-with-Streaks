import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { habitRepository, completionRepository } from '../db/store';
import { createHabitSchema, updateHabitSchema, idParamSchema } from '../validators';
import { getUserToday } from '../utils/dateUtils';
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  getScheduleLabel,
  isHabitScheduledOnDate,
} from '../services/scheduleEngine';

export const habitController = {
  async getHabits(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const today = getUserToday(req.user!.timezone);
      const includeArchived = req.query.archived === 'true';

      const habits = await habitRepository.findByUserId(userId, includeArchived);
      const habitIds = habits.map((h) => h.id);
      const completionsMap = await completionRepository.findForHabits(habitIds);

      const items = habits.map((h) => {
        const completions = completionsMap[h.id] || [];
        const completionSet = new Set(completions);
        const currentStreak = calculateCurrentStreak(h, completions, today);
        const longestStreak = calculateLongestStreak(h, completions, today);
        const scheduleLabel = getScheduleLabel(h.scheduleType, h.scheduleConfiguration);
        const isScheduledToday = isHabitScheduledOnDate(
          h.scheduleType,
          h.scheduleConfiguration,
          today
        );
        const isCompletedToday = completionSet.has(today);

        return {
          ...h,
          scheduleLabel,
          currentStreak,
          longestStreak,
          isScheduledToday,
          isCompletedToday,
          totalCompletions: completions.length,
        };
      });

      res.status(200).json({ habits: items, today });
    } catch (err: any) {
      console.error('Error fetching habits:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getHabitById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const paramValidation = idParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        res.status(400).json({ error: 'Invalid habit ID' });
        return;
      }

      const habit = await habitRepository.findById(paramValidation.data.id);
      if (!habit) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }

      // Authorization check: User must own the habit
      if (habit.userId !== req.user!.id) {
        res.status(403).json({ error: 'Forbidden. You do not have access to this habit.' });
        return;
      }

      const today = getUserToday(req.user!.timezone);
      const completions = await completionRepository.findByHabitId(habit.id);
      const completionDates = completions.map((c) => c.localDate);
      const completionSet = new Set(completionDates);

      const currentStreak = calculateCurrentStreak(habit, completionDates, today);
      const longestStreak = calculateLongestStreak(habit, completionDates, today);
      const scheduleLabel = getScheduleLabel(habit.scheduleType, habit.scheduleConfiguration);
      const isScheduledToday = isHabitScheduledOnDate(
        habit.scheduleType,
        habit.scheduleConfiguration,
        today
      );
      const isCompletedToday = completionSet.has(today);

      res.status(200).json({
        habit: {
          ...habit,
          scheduleLabel,
          currentStreak,
          longestStreak,
          isScheduledToday,
          isCompletedToday,
          totalCompletions: completions.length,
        },
        recentCompletions: completions.slice(0, 30),
        today,
      });
    } catch (err: any) {
      console.error('Error getting habit details:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async createHabit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validation = createHabitSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.format(),
        });
        return;
      }

      const { name, description, icon, color, scheduleType, scheduleConfiguration, reminderTime } =
        validation.data;

      const scheduleConfigString =
        typeof scheduleConfiguration === 'object'
          ? JSON.stringify(scheduleConfiguration)
          : scheduleConfiguration || '{}';

      const habit = await habitRepository.create({
        userId: req.user!.id,
        name,
        description,
        icon,
        color,
        scheduleType,
        scheduleConfiguration: scheduleConfigString,
        reminderTime,
      });

      const today = getUserToday(req.user!.timezone);
      const scheduleLabel = getScheduleLabel(habit.scheduleType, habit.scheduleConfiguration);

      res.status(201).json({
        message: 'Habit created successfully',
        habit: {
          ...habit,
          scheduleLabel,
          currentStreak: 0,
          longestStreak: 0,
          isScheduledToday: isHabitScheduledOnDate(habit.scheduleType, habit.scheduleConfiguration, today),
          isCompletedToday: false,
          totalCompletions: 0,
        },
      });
    } catch (err: any) {
      console.error('Error creating habit:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async updateHabit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const paramValidation = idParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        res.status(400).json({ error: 'Invalid habit ID' });
        return;
      }

      const habit = await habitRepository.findById(paramValidation.data.id);
      if (!habit) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }

      // Authorization check
      if (habit.userId !== req.user!.id) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const bodyValidation = updateHabitSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: bodyValidation.error.format(),
        });
        return;
      }

      const { name, description, icon, color, scheduleType, scheduleConfiguration, reminderTime } =
        bodyValidation.data;

      const scheduleConfigString =
        scheduleConfiguration !== undefined
          ? typeof scheduleConfiguration === 'object'
            ? JSON.stringify(scheduleConfiguration)
            : scheduleConfiguration
          : undefined;

      const updated = await habitRepository.update(habit.id, {
        name,
        description,
        icon,
        color,
        scheduleType,
        scheduleConfiguration: scheduleConfigString,
        reminderTime,
      });

      res.status(200).json({
        message: 'Habit updated successfully',
        habit: updated,
      });
    } catch (err: any) {
      console.error('Error updating habit:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async archiveHabit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const paramValidation = idParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        res.status(400).json({ error: 'Invalid habit ID' });
        return;
      }

      const habit = await habitRepository.findById(paramValidation.data.id);
      if (!habit) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }

      if (habit.userId !== req.user!.id) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const archived = await habitRepository.archive(habit.id);
      res.status(200).json({
        message: 'Habit archived successfully. Historical completions are preserved.',
        habit: archived,
      });
    } catch (err: any) {
      console.error('Error archiving habit:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async restoreHabit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const paramValidation = idParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        res.status(400).json({ error: 'Invalid habit ID' });
        return;
      }

      const habit = await habitRepository.findById(paramValidation.data.id);
      if (!habit) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }

      if (habit.userId !== req.user!.id) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const restored = await habitRepository.restore(habit.id);
      res.status(200).json({
        message: 'Habit restored successfully.',
        habit: restored,
      });
    } catch (err: any) {
      console.error('Error restoring habit:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async deleteHabit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const paramValidation = idParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        res.status(400).json({ error: 'Invalid habit ID' });
        return;
      }

      const habit = await habitRepository.findById(paramValidation.data.id);
      if (!habit) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }

      if (habit.userId !== req.user!.id) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      await habitRepository.delete(habit.id);
      res.status(200).json({ message: 'Habit permanently deleted.' });
    } catch (err: any) {
      console.error('Error deleting habit:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
