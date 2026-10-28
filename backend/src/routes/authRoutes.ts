import { Router } from 'express';
import { authController } from '../controllers/authController';
import { requireAuth, authRateLimiter } from '../middleware/auth';

const router = Router();

router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.patch('/timezone', requireAuth, authController.updateTimezone);

export default router;
