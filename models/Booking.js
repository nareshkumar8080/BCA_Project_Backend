const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },
    status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
    bookingMessage: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);


