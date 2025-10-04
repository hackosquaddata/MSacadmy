import express from 'express';
import { getContentComments, createComment } from '../controllers/Comments.controller.js';

const router = express.Router();

router.get('/content/:contentId/comments', getContentComments);
router.post('/content/:contentId/comments', createComment);

export default router;
