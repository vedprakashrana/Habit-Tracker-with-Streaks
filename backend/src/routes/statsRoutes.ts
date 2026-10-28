import { Router } from 'express';
import { statsController } from '../controllers/statsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/', statsController.getStats);

export default router;
