const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  registerParticipant,
} = require('../controllers/eventController');

router.get('/', getEvents);
router.post('/', auth, createEvent);
router.put('/:id', auth, updateEvent);
router.delete('/:id', auth, deleteEvent);
router.post('/:id/register', auth, registerParticipant);

module.exports = router;
