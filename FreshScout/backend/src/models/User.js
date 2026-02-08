import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  city: { type: String, default: 'almaty' },
  favorites: [{ type: String }],  // product IDs
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);
export default User;
