import { Router } from 'express';
import { userController } from '../controller/user.controller';

const router = Router();

router.post('/update-balance', userController.updateBalance);

router.get('/:userId', userController.getUserById);

export const userRoutes = router;
