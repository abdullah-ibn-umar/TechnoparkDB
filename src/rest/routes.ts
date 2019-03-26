import express from 'express';
import user    from './components/user/routes';
import forum   from './components/forum/routes';
import thread  from './components/thread/routes';

const router = express.Router();
router.use('/user', user);
router.use('/forum', forum);
router.use('/thread', thread);

export default router;
