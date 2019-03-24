import express from 'express';
import user    from './components/user/routes';
import forum   from './components/forum/routes';

const router = express.Router();
router.use('/user', user);
router.use('/forum', forum);

export default router;
