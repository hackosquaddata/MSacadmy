import express from 'express';
import { getContentComments, createComment} from '../controllers/Comments.controller.js';

const router = express.Router();

router.get('/lessons/:lessonId/comments', getContentComments);
router.post('/lessons/:lessonId/comments', createComment);

export default router;
