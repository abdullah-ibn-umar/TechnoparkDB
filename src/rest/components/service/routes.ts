import express    from 'express';
import controller from './controller';

const router = express.Router();

router.post('/status', controller.status);
router.post('/clear', controller.clear);

export default router;
