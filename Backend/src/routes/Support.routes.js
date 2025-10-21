import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createTicket, listMyTickets, listAllTickets, updateTicketStatus, listComments, addComment } from '../controllers/Support.controller.js';

const router = express.Router();

// User endpoints
router.post('/', authenticate, createTicket);
router.get('/mine', authenticate, listMyTickets);

// Admin endpoints
router.get('/admin/all', authenticate, listAllTickets);
router.patch('/admin/:id/status', authenticate, updateTicketStatus);

// Comments on a ticket (admin or owner)
router.get('/:id/comments', authenticate, listComments);
router.post('/:id/comments', authenticate, addComment);

export default router;
