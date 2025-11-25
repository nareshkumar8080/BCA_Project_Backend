const Complaint = require("../models/Complaint");
const Booking = require("../models/Booking");
const Ride = require("../models/Ride");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const createError = require("http-errors");
const { sendEmail } = require("../utils/emailService");

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL_ADDRESS || process.env.SENDER_EMAIL_ADDRESS;

exports.addComplaint = asyncHandler(async (req, res) => {
  const { rideId, message } = req.body;
  if (!rideId || !message) {
    throw createError(400, "Ride and message are required");
  }

  // Check if user account is active
  const user = await User.findById(req.user.id);
  if (!user || !user.isActive) {
    throw createError(403, "Account deactivated. You cannot file complaints.");
  }

  const ride = await Ride.findById(rideId).populate("riderId", "name email");
  if (!ride) {
    throw createError(404, "Ride not found");
  }

  const passengerBooking = await Booking.findOne({ rideId, userId: req.user.id });
  const isRider = ride.riderId?._id?.toString() === req.user.id;

  if (!isRider && !passengerBooking && req.user.role !== "admin") {
    throw createError(403, "You can only complain about rides you participated in");
  }

  const complaint = await Complaint.create({
    rideId,
    message,
    userId: req.user.id,
  });

  const complainer = await User.findById(req.user.id).select("name email");

  if (ride && complainer) {
    const subject = "Campus Ride Share - New complaint submitted";
    const text = `Complaint details:

Rider: ${ride.riderId?.name || "N/A"}
Customer: ${complainer.name}
Ride: ${ride.from} → ${ride.to} on ${ride.date} at ${ride.time}

Message:
${message}

Complaint ID: ${complaint._id}`;

    const recipients = [SUPPORT_EMAIL, ride.riderId?.email].filter(Boolean);
    if (recipients.length) {
      await Promise.all(
        recipients.map((to) =>
          sendEmail({
            to,
            subject,
            text,
          })
        )
      );
    }
  }

  res.status(201).json({ success: true, data: complaint });
});

exports.getComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find()
    .populate("userId", "name email")
    .populate("rideId", "from to date time status");

  res.json({ success: true, data: complaints });
});


