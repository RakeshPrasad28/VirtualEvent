const mongoose = require('mongoose');
const eventSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  date:        { type: Date, required: true },
  time:        { type: String, required: true },
  description: { type: String },
  organizer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
module.exports = mongoose.model('Event', eventSchema);
