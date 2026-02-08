import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  { title: String, unit: String, qty: Number },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    date: String,
    status: { type: String, enum: ["delivered", "processing", "canceled"], default: "processing" },
    items: [ItemSchema],
    total: Number,

    // позже: owner (User)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
