import { Router } from 'express';
import { login, logout, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/authValidator';

const router = Router();

// POST /api/auth/login - Public
router.post('/login', validate(loginSchema), login);

// POST /api/auth/logout - Protected
router.post('/logout', authenticate, logout);

// GET /api/auth/me - Protected
router.get('/me', authenticate, getMe);

export default router;
