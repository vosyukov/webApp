import { Router } from 'express';
import { cronController } from '../controller/cron.controller';

const router = Router();

router.get('/', cronController.getAllTasks);

router.get('/history', cronController.getTaskHistory);

router.get('/history/:taskId', cronController.getTaskHistory);

export const cronRoutes = router;
