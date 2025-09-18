const Event = require('../models/Event');

exports.createEvent = async (req, res) => {
  try {
    const { name, date, time, description } = req.body;
    const event = await Event.create({ name, date, time, description, organizer: req.user.id });
    res.status(201).json({ event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, organizer: req.user.id },
      req.body,
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found or unauthorized' });
    res.json({ event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, organizer: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found or unauthorized' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.registerParticipant = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.participants.includes(req.user.id))
      return res.status(400).json({ error: 'Already registered' });
    event.participants.push(req.user.id);
    await event.save();
    res.json({ event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getEvents = async (req, res) => {
  const events = await Event.find().populate('organizer', 'username email');
  res.json(events);
};
