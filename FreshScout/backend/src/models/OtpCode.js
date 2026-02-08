import mongoose from "mongoose";

const OtpCodeSchema = new mongoose.Schema(
  {
    phone: { type: String, index: true, required: true },
    codeHash: { type: String, required: true },
    attemptsLeft: { type: Number, default: 5 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("OtpCode", OtpCodeSchema);
