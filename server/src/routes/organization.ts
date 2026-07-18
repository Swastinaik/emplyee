import { Router } from 'express';
import { getOrgTree } from '../controllers/organizationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/organization/tree - Private (All authenticated roles)
router.get('/tree', authenticate, getOrgTree);

export default router;
