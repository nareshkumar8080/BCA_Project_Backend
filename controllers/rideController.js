const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const createError = require("http-errors");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const Complaint = require("../models/Complaint");
const asyncHandler = require("../utils/asyncHandler");
const { calculateFare } = require("../utils/calculateFare");

dayjs.extend(customParseFormat);

const buildRideDateTime = (ride) =>
  dayjs(`${ride.date} ${ride.time}`, ["YYYY-MM-DD hh:mm A", "YYYY-MM-DD HH:mm"], true);

exports.addRide = asyncHandler(async (req, res) => {
  const { from, to, distance, date, time, seats = 1, riderContact } = req.body;

  if (!from || !to || !distance || !date || !time) {
    throw createError(400, "Missing required fields");
  }

  const fare = calculateFare(distance);

  const ride = await Ride.create({
    from,
    to,
    distance,
    fare,
    date,
    time,
    seats,
    riderContact: riderContact || req.user?.phone,
    riderId: req.user.id,
  });

  res.status(201).json({
    success: true,
    data: ride,
  });
});

exports.getRealTimeRides = asyncHandler(async (req, res) => {
  const { from, to, gender, date, maxPrice, minRating } = req.query;
  const now = dayjs();

  const filters = { status: "active" };
  if (from) filters.from = new RegExp(from, "i");
  if (to) filters.to = new RegExp(to, "i");

  const rides = await Ride.find(filters).populate("riderId", "name gender rating phone");

  const futureRides = rides.filter((ride) => {
    const rideDate = buildRideDateTime(ride);
    const isFuture = rideDate.isValid() ? rideDate.isAfter(now) : true;
    const matchesDate = date ? ride.date === date : true;
    const matchesGender = gender ? ride.riderId?.gender === gender : true;
    const matchesPrice = maxPrice ? ride.fare <= Number(maxPrice) : true;
    const matchesRating = minRating ? ride.riderId?.rating >= Number(minRating) : true;
    return isFuture && matchesDate && matchesGender && matchesPrice && matchesRating;
  });

  res.json({
    success: true,
    data: futureRides,
  });
});

exports.getRideById = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.id).populate("riderId", "name phone gender rating");
  if (!ride) {
    throw createError(404, "Ride not found");
  }
  res.json({ success: true, data: ride });
});

exports.getMyRides = asyncHandler(async (req, res) => {
  const query = { riderId: req.user.id };
  if (req.user.role === "admin" && req.query.riderId) {
    query.riderId = req.query.riderId;
  }

  const rides = await Ride.find(query).sort({ createdAt: -1 });
  res.json({ success: true, data: rides });
});

exports.updateRide = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.id);
  if (!ride) throw createError(404, "Ride not found");

  if (ride.riderId.toString() !== req.user.id && req.user.role !== "admin") {
    throw createError(403, "Not allowed to modify this ride");
  }

  const updates = req.body;
  if (updates.distance) {
    updates.fare = calculateFare(updates.distance);
  }

  const updatedRide = await Ride.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json({ success: true, data: updatedRide });
});

exports.deleteRide = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.id);
  if (!ride) throw createError(404, "Ride not found");

  if (ride.riderId.toString() !== req.user.id && req.user.role !== "admin") {
    throw createError(403, "Not allowed to delete this ride");
  }

  await Promise.all([
    ride.deleteOne(),
    Booking.deleteMany({ rideId: ride._id }),
    Complaint.deleteMany({ rideId: ride._id }),
  ]);
  res.json({ success: true, message: "Ride deleted" });
});

exports.listAll = asyncHandler(async (req, res) => {
  const rides = await Ride.find().sort({ createdAt: -1 });
  res.json({ success: true, data: rides });
});

