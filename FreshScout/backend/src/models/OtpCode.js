import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  codeHash: { type: String, required: true },
  attemptsLeft: { type: Number, default: 3 },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // TTL 5 min
});

const OtpCode = mongoose.model('OtpCode', otpSchema);
export default OtpCode;
