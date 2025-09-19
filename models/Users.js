import  mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  username: { type: String, required: true,trim: true },
  email:    { type: String, required: true, unique: true,trim: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['organizer', 'attendee'], required: true }
});
const User = mongoose.model('User', userSchema);
export default User;