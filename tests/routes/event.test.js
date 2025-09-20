import request from 'supertest';
import { jest, describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import bodyParser from 'body-parser';

import eventRouter from '../../routes/Event.js';
import User from '../../models/Users.js';
import Event from '../../models/Event.js';
import * as mailUtils from '../../utils/mail.js';

jest.mock('../../utils/mail.js', () => ({
  sendConfirmationEmail: jest.fn(() => Promise.resolve()),
}));

const requireAuth = (req, res, next) => {
  req.user = req.user || { id: req.headers['user-id'], role: req.headers['role'] };
  if (!req.user.id) return res.status(401).json({ message: 'Unauthorized' });
  next();
};
const authorizeOrganizer = (req, res, next) => {
  if (req.user.role !== 'organizer') return res.status(403).json({ message: 'Forbidden organizer' });
  next();
};
const authorizeAttendee = (req, res, next) => {
  if (req.user.role !== 'attendee') return res.status(403).json({ message: 'Forbidden attendee' });
  next();
};

describe('Event API Routes', () => {
  let app;
  let mongoServer;
  let organizerId;
  let attendeeId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(bodyParser.json());

    app.use((req, res, next) => {
      req.headers['user-id'] && (req.user = { id: req.headers['user-id'], role: req.headers['role'] });
      next();
    });

    
    const router = express.Router();
    router.get('/', requireAuth, eventRouter.stack.find(r => r.route.path === '/').route.stack[1].handle);
    router.post('/create-events', requireAuth, authorizeOrganizer, eventRouter.stack.find(r => r.route.path === '/create-events').route.stack[2].handle);
    router.post('/:id/register', requireAuth, authorizeAttendee, eventRouter.stack.find(r => r.route.path === '/:id/register').route.stack[2].handle);
    router.put('/update/:id', requireAuth, authorizeOrganizer, eventRouter.stack.find(r => r.route.path === '/update/:id').route.stack[2].handle);
    router.delete('/:id', requireAuth, authorizeOrganizer, eventRouter.stack.find(r => r.route.path === '/:id').route.stack[2].handle);
    router.get('/part', requireAuth, authorizeAttendee, eventRouter.stack.find(r => r.route.path === '/part').route.stack[2].handle);

    app.use('/api/events', router);

    const organizer = new User({ username: 'org', email: 'org@mail.com', password: 'hash', role: 'organizer' });
    const attendee = new User({ username: 'att', email: 'att@mail.com', password: 'hash', role: 'attendee' });
    await organizer.save();
    await attendee.save();
    organizerId = organizer._id.toString();
    attendeeId = attendee._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await Event.deleteMany({});
  });

  it('GET /api/events - requires auth', async () => {
    const res = await request(app).get('/api/events');
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/events/create-events - create new event', async () => {
    const res = await request(app)
      .post('/api/events/create-events')
      .set('user-id', organizerId)
      .set('role', 'organizer')
      .send({ name: 'Test Event', date: '2025-12-12', time: '10:00', description: 'Desc' });
    expect(res.statusCode).toBe(201);
    expect(res.body.event.name).toBe('Test Event');
  });


    it('POST /api/events/:id/register - attendee registration', async () => {
        const ev = new Event({ name: 'RegEvent', date: '2025-11-11', time: '11:00', description: 'Desc', organizer: organizerId, attendee: [] });
    await ev.save();

    const res = await request(app)
      .post(`/api/events/${ev._id.toString()}/register`)
      .set('user-id', attendeeId)
      .set('role', 'attendee');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Successfully registered');
    }, 20000);

  it('PUT /api/events/update/:id - update event by organizer', async () => {
    const ev = new Event({ name: 'UpEvent', date: '2025-10-10', time: '15:00', description: 'Desc', organizer: organizerId, attendee: [] });
    await ev.save();

    const res = await request(app)
      .put(`/api/events/update/${ev._id.toString()}`)
      .set('user-id', organizerId)
      .set('role', 'organizer')
      .send({ name: 'Updated Event', description: 'New Desc' });
    expect(res.statusCode).toBe(200);
    expect(res.body.event.name).toBe('Updated Event');
  });

  it('DELETE /api/events/:id - delete event by organizer', async () => {
    const ev = new Event({ name: 'DelEvent', date: '2025-09-09', time: '09:00', description: 'Desc', organizer: organizerId, attendee: [] });
    await ev.save();

    const res = await request(app)
      .delete(`/api/events/${ev._id.toString()}`)
      .set('user-id', organizerId)
      .set('role', 'organizer');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('deleted');
  });

  it('GET /api/events/part - get attended events for attendee', async () => {
    const ev = new Event({ name: 'PartEvent', date: '2025-08-08', time: '08:00', description: 'Desc', organizer: organizerId, attendee: [attendeeId] });
    await ev.save();

    const res = await request(app)
      .get('/api/events/part')
      .set('user-id', attendeeId)
      .set('role', 'attendee');
    expect(res.statusCode).toBe(200);
    expect(res.body.events).toBeInstanceOf(Array);
    expect(res.body.events[0].attendee.email).toBe('att@mail.com');
  });
});
