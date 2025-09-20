import { jest, describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Event from '../../models/Event.js';
import User from '../../models/Users.js';
import * as eventController from '../../controllers/eventController.js';

import * as mailUtils from '../../utils/mail.js';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock('../../utils/mail.js', () => ({
  sendConfirmationEmail: jest.fn(() => Promise.resolve())
}));

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  jest.clearAllMocks();
  await Event.deleteMany({});
  await User.deleteMany({});
});

describe('createEvent', () => {
  it('returns 400 on duplicate event', async () => {
    const existingOrganizerId = new mongoose.Types.ObjectId();
    const existing = new Event({
      name: 'Duplicate Event',
      date: '2025-10-10',
      time: '10:00',
      organizer: existingOrganizerId,
      attendee: []
    });
    await existing.save();

    const req = {
      body: { name: 'Duplicate Event', date: '2025-10-10', time: '10:00', description: 'Desc' },
      user: { id: new mongoose.Types.ObjectId() }
    };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await eventController.createEvent(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'Duplicate event: An event with this name, date, and time already exists.' });
  });

  it('creates event successfully', async () => {
    const organizerId = new mongoose.Types.ObjectId();
    const req = {
      body: { name: 'New Event', date: '2025-10-12', time: '12:00', description: 'Desc' },
      user: { id: organizerId }
    };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await eventController.createEvent(req, res);

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Event created successfully',
      event: expect.objectContaining({ name: 'New Event', organizer: organizerId })
    }));
  });
});

describe('getAllEvents', () => {
  it('returns all events', async () => {
    const organizerId = new mongoose.Types.ObjectId();
    const evt = new Event({
      name: 'Event1',
      date: '2025-11-01',
      time: '14:00',
      organizer: organizerId,
      attendee: []
    });
    await evt.save();

    const req = {};
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await eventController.getAllEvents(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Events retrieved successfully',
      events: expect.any(Array)
    }));
  });
});

describe('updateEvent', () => {
  it('returns 403 if user not organizer', async () => {
    const organizerId = new mongoose.Types.ObjectId();
    const event = new Event({
      name: 'Update Me',
      date: '2025-10-01',
      time: '11:00',
      organizer: organizerId,
      attendee: []
    });
    await event.save();

    const req = {
      params: { id: event._id.toString() },
      body: { name: 'Changed' },
      user: { id: new mongoose.Types.ObjectId() } 
    };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await eventController.updateEvent(req, res);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ message: 'You are not authorized to update this event.' });
  });

  it('updates event successfully', async () => {
    const organizerId = new mongoose.Types.ObjectId();
    const event = new Event({
      name: 'Update Me',
      date: '2025-10-01',
      time: '11:00',
      organizer: organizerId,
      attendee: []
    });
    await event.save();

    const req = {
      params: { id: event._id.toString() },
      body: { name: 'Changed Name' },
      user: { id: organizerId.toString() }
    };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await eventController.updateEvent(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Event updated successfully',
      event: expect.objectContaining({ name: 'Changed Name' })
    }));
  });
});

describe('deleteEvent', () => {
  it('returns 403 if user not organizer', async () => {
    const organizerId = new mongoose.Types.ObjectId();
    const event = new Event({
      name: 'Delete Me',
      date: '2025-10-05',
      time: '15:00',
      organizer: organizerId,
      attendee: []
    });
    await event.save();

    const req = {
      params: { id: event._id.toString() },
      user: { id: new mongoose.Types.ObjectId() } 
    };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await eventController.deleteEvent(req, res);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ message: 'You are not authorized to delete this event.' });
  });

  it('deletes event successfully', async () => {
    const organizerId = new mongoose.Types.ObjectId();
    const event = new Event({
      name: 'Delete Me',
      date: '2025-10-05',
      time: '15:00',
      organizer: organizerId,
      attendee: []
    });
    await event.save();

    const req = {
      params: { id: event._id.toString() },
      user: { id: organizerId.toString() }
    };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await eventController.deleteEvent(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ message: 'Event deleted successfully.' });
  });
});

describe('registerForEvent', () => {
  it('returns 400 if already registered', async () => {
    const userId = new mongoose.Types.ObjectId();
    const event = new Event({
      name: 'Register Test',
      date: '2025-12-01',
      time: '09:00',
      organizer: new mongoose.Types.ObjectId(),
      attendee: [userId]
    });
    await event.save();

    const req = {
      params: { id: event._id.toString() },
      user: { id: userId.toString() }
    };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await eventController.registerForEvent(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'You are already registered for this event.' });
  });

//   it('registers and sends confirmation email', async () => {
//     const userId = new mongoose.Types.ObjectId();
//     const user = new User({
//       _id: userId,
//       username: 'attendee',
//       email: 'attendee@mail.com',
//       password: 'hash',
//       role: 'attendee'
//     });
//     await user.save();

//     const event = new Event({
//       name: 'Register Test',
//       date: '2025-12-01',
//       time: '09:00',
//       organizer: new mongoose.Types.ObjectId(),
//       attendee: []
//     });
//     await event.save();

//     const req = {
//       params: { id: event._id.toString() },
//       user: { id: userId.toString() }
//     };
//     const json = jest.fn();
//     const status = jest.fn(() => ({ json }));
//     const res = { status };

//     await eventController.registerForEvent(req, res);

//     expect(status).toHaveBeenCalledWith(200);
//     expect(json).toHaveBeenCalledWith(expect.objectContaining({
//       message: 'Successfully registered for the event.',
//       event: expect.any(Object)
//     }));

//     expect(mailUtils.sendConfirmationEmail).toHaveBeenCalled();
//   }, 20000); 

});

describe('getAttendeeEvents', () => {
  it('returns participated events only with correct attendee info', async () => {
    const userId = new mongoose.Types.ObjectId();
    const user = new User({
      _id: userId,
      username: 'attendee',
      email: 'attendee@mail.com',
      password: 'hash',
      role: 'attendee'
    });
    await user.save();

    const event = new Event({
      name: 'Participated Event',
      date: '2025-12-15',
      time: '11:00',
      organizer: new mongoose.Types.ObjectId(),
      attendee: [userId]
    });
    await event.save();

    const req = {
      user: { id: userId.toString() }
    };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    await eventController.getAttendeeEvents(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Participated events fetched successfully',
      events: expect.any(Array)
    }));

    const eventsResult = json.mock.calls[0][0].events;
    expect(eventsResult.length).toBe(1);
    expect(eventsResult[0].attendee.email).toBe('attendee@mail.com');
  });
});
