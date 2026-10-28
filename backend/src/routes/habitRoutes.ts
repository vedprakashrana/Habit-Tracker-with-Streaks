import { Router } from 'express';
import { habitController } from '../controllers/habitController';
import { completionController } from '../controllers/completionController';
import { heatmapController } from '../controllers/heatmapController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protect all habit routes
router.use(requireAuth);

// Habit CRUD & Actions
router.get('/', habitController.getHabits);
router.post('/', habitController.createHabit);
router.get('/:id', habitController.getHabitById);
router.patch('/:id', habitController.updateHabit);
router.delete('/:id', habitController.deleteHabit);
router.post('/:id/archive', habitController.archiveHabit);
router.post('/:id/restore', habitController.restoreHabit);

// Completions
router.get('/:id/completions', completionController.getCompletions);
router.put('/:id/completions/:date', completionController.setCompletion);
router.delete('/:id/completions/:date', completionController.removeCompletion);

// Heatmap
router.get('/:id/heatmap', heatmapController.getHeatmap);

export default router;
