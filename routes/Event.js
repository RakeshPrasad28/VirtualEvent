import express from 'express'
import { authorizeAttendee, authorizeOrganizer, requireAuth } from '../middlewares/auth.js';
import { createEvent, deleteEvent, getAllEvents, getAttendeeEvents, registerForEvent, updateEvent } from '../controllers/eventController.js';
const eventRouter = express.Router();


eventRouter.get('/',requireAuth, getAllEvents);
eventRouter.post('/create-events',requireAuth, authorizeOrganizer, createEvent);
eventRouter.post('/:id/register',requireAuth,authorizeAttendee, registerForEvent);
eventRouter.put('/update/:id',requireAuth,authorizeOrganizer, updateEvent);
eventRouter.delete('/:id',requireAuth,authorizeOrganizer, deleteEvent);
eventRouter.get('/part',requireAuth,authorizeAttendee, getAttendeeEvents);

export default eventRouter;
