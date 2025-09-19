import Event from '../models/Event.js';
import User from '../models/Users.js';
import { sendConfirmationEmail } from '../utils/mail.js';

export const createEvent = async (req, res) => {
  try {
    const { name, date, time, description } = req.body;
    const organizer = req.user.id;
    const existingEvent = await Event.findOne({ name, date, time });
    if (existingEvent) {
      return res.status(400).json({ message: 'Duplicate event: An event with this name, date, and time already exists.' });
    }

    const event = new Event({
      name,
      date,
      time,
      description,
      organizer,
      attendee: [],
    });

    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'username email')
      .populate('attendee', 'username email'); 

    res.status(200).json({
      message: 'Events retrieved successfully',
      events,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const attendeeId = req.user.id;
    // console.log(eventId,attendeeId)
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    const user = await User.findById(attendeeId);
    if (event.attendee.includes(attendeeId)) {
      return res.status(400).json({ message: 'You are already registered for this event.' });
    }
    event.attendee.push(attendeeId);
    await event.save();
    await sendConfirmationEmail(user,event);
    res.status(200).json({ message: 'Successfully registered for the event.', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


