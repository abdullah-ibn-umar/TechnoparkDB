import express    from 'express';
import controller from './controller';

const router = express.Router();

router.post('/:slug_or_id/create', controller.createPosts);
router.get('/:slug_or_id/details', controller.details);
router.post('/:slug_or_id/details', controller.update);

export default router;
