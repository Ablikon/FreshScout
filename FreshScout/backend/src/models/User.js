import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    phone: { type: String, unique: true, required: true }, 
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
