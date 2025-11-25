const appName = "Campus Ride Share";

const verificationTemplate = (name, token) => ({
  subject: `${appName} - Verify your email`,
  text: `Hi ${name},

Please verify your email to activate your ${appName} account.

Verification code: ${token}

If you did not sign up, please ignore this email.`,
});

const bookingNotificationTemplate = (name, ride, passengerName, bookingMessage) => ({
  subject: `${appName} - Ride booked`,
  text: `Hi ${name},

${passengerName} just booked your ride from ${ride.from} to ${ride.to} scheduled on ${ride.date} at ${ride.time}.

Passenger instructions:
${bookingMessage || "No additional instructions were shared."}

Please reach out to coordinate the trip.

Team ${appName}`,
});

const forgotPasswordTemplate = (name, token) => ({
  subject: `${appName} - Password reset`,
  text: `Hi ${name},

Use the following reset code to change your password:

Reset code: ${token}

If you did not request this, please ignore the email.`,
});

module.exports = {
  verificationTemplate,
  bookingNotificationTemplate,
  forgotPasswordTemplate,
};


