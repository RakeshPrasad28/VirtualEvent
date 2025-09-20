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

export const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { name, date, time, description } = req.body;
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (event.organizer.toString() !== organizerId) {
      return res.status(403).json({ message: "You are not authorized to update this event." });
    }

    const duplicate = await Event.findOne({
      _id: { $ne: eventId },
      name, 
      date, 
      time
    });
    if (duplicate) {
      return res.status(400).json({ message: 'Duplicate event: An event with this name, date, and time already exists.' });
    }

    if (name) event.name = name;
    if (date) event.date = date;
    if (time) event.time = time;
    if (description) event.description = description;

    await event.save();

    res.status(200).json({
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const organizerId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (event.organizer.toString() !== organizerId) {
      return res.status(403).json({ message: 'You are not authorized to delete this event.' });
    }

    await Event.findByIdAndDelete(eventId);

    res.status(200).json({ message: 'Event deleted successfully.' });
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

export const getAttendeeEvents = async (req, res) => {
   try {
    const userId = req.user.id;

    const events = await Event.find({ attendee: userId })
      .populate('organizer', 'username email');

    const user = await User.findById(userId, 'username email');
    const filteredEvents = events.map(event => ({
      _id: event._id,
      name: event.name,
      date: event.date,
      time: event.time,
      description: event.description,
      organizer: event.organizer,
      attendee: user, 
    }));

    res.status(200).json({
      message: 'Participated events fetched successfully',
      events: filteredEvents
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};



