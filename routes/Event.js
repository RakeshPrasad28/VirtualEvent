import express from 'express'
import { authorizeAttendee, authorizeOrganizer, requireAuth } from '../middlewares/auth.js';
import { createEvent, getAllEvents, registerForEvent } from '../controllers/eventController.js';
const eventRouter = express.Router();


eventRouter.get('/',requireAuth, getAllEvents);
eventRouter.post('/create-events',requireAuth, authorizeOrganizer, createEvent);
eventRouter.post('/:id/register',requireAuth,authorizeAttendee, registerForEvent);

export default eventRouter;
