import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { habitRepository, completionRepository } from '../db/store';
import { idParamSchema, dateParamSchema } from '../validators';
import { getUserToday, validateCorrectionWindow } from '../utils/dateUtils';
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  isHabitScheduledOnDate,
} from '../services/scheduleEngine';

export const completionController = {
  async getCompletions(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const completions = await completionRepository.findByHabitId(habit.id);
      res.status(200).json({ completions });
    } catch (err: any) {
      console.error('Error fetching completions:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async setCompletion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const idValidation = idParamSchema.safeParse({ id: req.params.id });
      const dateValidation = dateParamSchema.safeParse({ date: req.params.date });

      if (!idValidation.success) {
        res.status(400).json({ error: 'Invalid habit ID' });
        return;
      }

      if (!dateValidation.success) {
        res.status(400).json({
          error: 'Invalid date format. Expected YYYY-MM-DD.',
          code: 'INVALID_DATE',
        });
        return;
      }

      const habit = await habitRepository.findById(idValidation.data.id);
      if (!habit) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }

      // Authorization check
      if (habit.userId !== req.user!.id) {
        res.status(403).json({ error: 'Forbidden. You do not own this habit.' });
        return;
      }

      const today = getUserToday(req.user!.timezone);
      const targetDate = dateValidation.data.date;

      // 7-day correction window validation
      const windowCheck = validateCorrectionWindow(targetDate, today);
      if (!windowCheck.valid) {
        res.status(400).json({
          error: windowCheck.error,
          code: 'OUTSIDE_CORRECTION_WINDOW',
        });
        return;
      }

      // Check if habit is scheduled for this date (for DAILY and WEEKDAYS)
      const isScheduled = isHabitScheduledOnDate(
        habit.scheduleType,
        habit.scheduleConfiguration,
        targetDate
      );
      if (!isScheduled) {
        res.status(400).json({
          error: `Habit is not scheduled on this day (${targetDate}).`,
          code: 'NOT_SCHEDULED',
        });
        return;
      }

      // Create completion (idempotent; prevents duplicates)
      const completion = await completionRepository.create(habit.id, targetDate);

      // Recalculate streaks
      const allCompletions = await completionRepository.findByHabitId(habit.id);
      const completionDates = allCompletions.map((c) => c.localDate);
      const currentStreak = calculateCurrentStreak(habit, completionDates, today);
      const longestStreak = calculateLongestStreak(habit, completionDates, today);

      res.status(200).json({
        message: 'Habit marked as completed for date',
        completion,
        currentStreak,
        longestStreak,
        isCompletedToday: targetDate === today ? true : completionDates.includes(today),
      });
    } catch (err: any) {
      console.error('Error recording completion:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async removeCompletion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const idValidation = idParamSchema.safeParse({ id: req.params.id });
      const dateValidation = dateParamSchema.safeParse({ date: req.params.date });

      if (!idValidation.success) {
        res.status(400).json({ error: 'Invalid habit ID' });
        return;
      }

      if (!dateValidation.success) {
        res.status(400).json({
          error: 'Invalid date format. Expected YYYY-MM-DD.',
          code: 'INVALID_DATE',
        });
        return;
      }

      const habit = await habitRepository.findById(idValidation.data.id);
      if (!habit) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }

      if (habit.userId !== req.user!.id) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const today = getUserToday(req.user!.timezone);
      const targetDate = dateValidation.data.date;

      // 7-day correction window check
      const windowCheck = validateCorrectionWindow(targetDate, today);
      if (!windowCheck.valid) {
        res.status(400).json({
          error: windowCheck.error,
          code: 'OUTSIDE_CORRECTION_WINDOW',
        });
        return;
      }

      await completionRepository.delete(habit.id, targetDate);

      // Recalculate streaks
      const allCompletions = await completionRepository.findByHabitId(habit.id);
      const completionDates = allCompletions.map((c) => c.localDate);
      const currentStreak = calculateCurrentStreak(habit, completionDates, today);
      const longestStreak = calculateLongestStreak(habit, completionDates, today);

      res.status(200).json({
        message: 'Completion record removed for date',
        currentStreak,
        longestStreak,
        isCompletedToday: targetDate === today ? false : completionDates.includes(today),
      });
    } catch (err: any) {
      console.error('Error removing completion:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
