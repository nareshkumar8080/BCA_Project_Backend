const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);


