import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { habitRepository, completionRepository } from '../db/store';
import { getUserToday } from '../utils/dateUtils';
import { calculate30DayStats } from '../services/scheduleEngine';
import { statsQuerySchema } from '../validators';

export const statsController = {
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const today = getUserToday(user.timezone);

      const queryValidation = statsQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        res.status(400).json({ error: 'Invalid query parameters' });
        return;
      }

      // We get all active habits for this user
      const habits = await habitRepository.findByUserId(user.id, false);
      const habitIds = habits.map((h) => h.id);
      const completionsMap = await completionRepository.findForHabits(habitIds);

      const stats = calculate30DayStats(habits, completionsMap, today);

      res.status(200).json({
        ...stats,
        today,
      });
    } catch (err: any) {
      console.error('Error fetching statistics:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
