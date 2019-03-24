import express    from 'express';
import controller from './controller';
import thread from '../thread/controller';

const router = express.Router();

router.post('/create', controller.create);
router.get('/:slug/details', controller.details);
router.post('/:slug/create', thread.create);
router.get('/:slug/threads', controller.threads);
router.get('/:slug/users', controller.threads);

export default router;
