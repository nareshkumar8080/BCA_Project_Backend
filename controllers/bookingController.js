const createError = require("http-errors");
const Booking = require("../models/Booking");
const Ride = require("../models/Ride");
const Rating = require("../models/Rating");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendEmail } = require("../utils/emailService");
const { bookingNotificationTemplate } = require("../utils/emailTemplates");

exports.confirmBooking = asyncHandler(async (req, res) => {
  const { rideId, bookingMessage } = req.body;
  const userId = req.user.id;

  const ride = await Ride.findById(rideId).populate("riderId");
  if (!ride) throw createError(404, "Ride not found");
  if (ride.status !== "active") throw createError(400, "Ride already booked");

  const passenger = await User.findById(userId).select("name email phone");

  let booking = await Booking.findOne({ rideId, userId });
  if (booking && booking.status === "confirmed") {
    throw createError(400, "You already booked this ride");
  }

  if (!booking) {
    booking = await Booking.create({ rideId, userId, status: "confirmed", bookingMessage });
  } else {
    booking.status = "confirmed";
    if (typeof bookingMessage === "string") {
      booking.bookingMessage = bookingMessage;
    }
    await booking.save();
  }

  ride.status = "booked";
  await ride.save();

  if (ride.riderId?.email) {
    await sendEmail({
      to: ride.riderId.email,
      ...bookingNotificationTemplate(
        ride.riderId.name,
        ride,
        passenger?.name || "A passenger",
        booking.bookingMessage
      ),
    });
  }

  res.json({
    success: true,
    message: "Ride booked successfully",
    data: booking,
    riderContact: ride.riderContact || ride.riderId?.phone,
  });
});

exports.getMyBookings = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const basePopulate = [
    {
      path: "rideId",
      populate: { path: "riderId", select: "name phone rating email" },
    },
    { path: "userId", select: "name phone rating email" },
  ];

  const passengerBookings = await Booking.find({ userId })
    .populate(basePopulate)
    .sort({ createdAt: -1 })
    .lean();

  const rideIds = await Ride.find({ riderId: userId }).select("_id");
  let riderBookings = [];
  if (rideIds.length) {
    riderBookings = await Booking.find({ rideId: { $in: rideIds.map((ride) => ride._id) } })
      .populate(basePopulate)
      .lean();
  }

  const ratings = await Rating.find({ byUser: userId }).select("rideId toUser").lean();
  const ratedPairs = new Set(
    ratings.map((rating) => `${rating.rideId.toString()}_${rating.toUser.toString()}`)
  );

  const toSerializable = (booking, role) => {
    const counterparty = role === "customer" ? booking.rideId?.riderId : booking.userId;
    const rideIdentifier =
      typeof booking.rideId === "object" ? booking.rideId?._id?.toString() : booking.rideId?.toString();
    const counterpartyId = counterparty?._id?.toString();
    const canRate = booking.status === "completed" && Boolean(rideIdentifier && counterpartyId);
    const hasRated = canRate && ratedPairs.has(`${rideIdentifier}_${counterpartyId}`);

    return {
      ...booking,
      role,
      counterparty,
      canRate,
      hasRated,
    };
  };

  const combined = [
    ...passengerBookings.map((booking) => toSerializable(booking, "customer")),
    ...riderBookings.map((booking) => toSerializable(booking, "rider")),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, data: combined });
});

exports.getBookingStatus = asyncHandler(async (req, res) => {
  const { rideId } = req.params;
  const booking = await Booking.findOne({ rideId, userId: req.user.id });
  if (!booking) throw createError(404, "Booking not found");

  res.json({ success: true, data: booking });
});

exports.markCompleted = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId).populate("rideId");
  if (!booking) throw createError(404, "Booking not found");

  const ride = booking.rideId;
  const isRider = ride.riderId.toString() === req.user.id;
  const isPassenger = booking.userId.toString() === req.user.id;
  if (!isRider && !isPassenger && req.user.role !== "admin") {
    throw createError(403, "Only ride owner or passenger can close the trip");
  }

  if (booking.status === "completed") {
    await booking.populate([
      {
        path: "rideId",
        populate: { path: "riderId", select: "name phone rating email" },
      },
      { path: "userId", select: "name phone rating email" },
    ]);
    return res.json({ success: true, message: "Ride already marked completed", data: booking });
  }

  booking.status = "completed";
  ride.status = "completed";
  await Promise.all([booking.save(), ride.save()]);

  await User.findByIdAndUpdate(ride.riderId, { $inc: { ridesCompleted: 1 } });
  await User.findByIdAndUpdate(booking.userId, { $inc: { ridesCompleted: 1 } });

  await booking.populate([
    {
      path: "rideId",
      populate: { path: "riderId", select: "name phone rating email" },
    },
    { path: "userId", select: "name phone rating email" },
  ]);

  res.json({ success: true, message: "Ride marked as completed", data: booking });
});

