require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cron = require("node-cron");
const createError = require("http-errors");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");

const authRoutes = require("./routes/authRoutes");
const rideRoutes = require("./routes/rideRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middleware/errorHandler");
const Ride = require("./models/Ride");

dayjs.extend(customParseFormat);

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "Campus Ride Share API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/rating", ratingRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res, next) => next(createError(404, "Route not found")));
app.use(errorHandler);

async function start() {
  const PORT = process.env.PORT || 8000;
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();

const cronExpression = process.env.cronBalanceTimings || "0 0 * * *";
cron.schedule(cronExpression, async () => {
  try {
    const now = dayjs();
    const rides = await Ride.find({ status: { $in: ["active", "booked"] } });
    const updates = rides
      .filter((ride) => {
        const rideDate = dayjs(`${ride.date} ${ride.time}`, ["YYYY-MM-DD hh:mm A", "YYYY-MM-DD HH:mm"], true);
        return rideDate.isValid() && rideDate.isBefore(now);
      })
      .map((ride) => ride._id);

    if (updates.length) {
      await Ride.updateMany({ _id: { $in: updates } }, { status: "completed" });
      console.log(`Cron job: marked ${updates.length} rides as completed`);
    }
  } catch (error) {
    console.error("Cron job error", error);
  }
});


