const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    fare: { type: Number, required: true },
    distance: { type: Number, required: true },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    seats: { type: Number, default: 1 },
    status: { type: String, enum: ["active", "booked", "completed"], default: "active" },
    riderContact: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ride", rideSchema);


