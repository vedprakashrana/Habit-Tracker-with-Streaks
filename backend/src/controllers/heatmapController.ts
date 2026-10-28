import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { habitRepository, completionRepository } from '../db/store';
import { idParamSchema, heatmapQuerySchema } from '../validators';
import { getUserToday } from '../utils/dateUtils';
import { buildHeatmapData, getScheduleLabel } from '../services/scheduleEngine';

export const heatmapController = {
  async getHeatmap(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        res.status(403).json({ error: 'Forbidden. You do not have access to this habit.' });
        return;
      }

      const queryValidation = heatmapQuerySchema.safeParse(req.query);
      const months = queryValidation.success ? queryValidation.data.months : 6;

      const today = getUserToday(req.user!.timezone);
      const completions = await completionRepository.findByHabitId(habit.id);
      const completionDates = completions.map((c) => c.localDate);

      const heatmap = buildHeatmapData(habit, completionDates, today, months);
      const scheduleLabel = getScheduleLabel(habit.scheduleType, habit.scheduleConfiguration);

      res.status(200).json({
        habitId: habit.id,
        habitName: habit.name,
        habitColor: habit.color,
        habitIcon: habit.icon,
        scheduleType: habit.scheduleType,
        scheduleLabel,
        today,
        totalCompleted: heatmap.totalCompleted,
        totalScheduled: heatmap.totalScheduled,
        days: heatmap.days,
      });
    } catch (err: any) {
      console.error('Error generating heatmap:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
