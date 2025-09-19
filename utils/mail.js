import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

export const sendConfirmationEmail = async (user,event) => {
  try {
    await transporter.sendMail({
    from: process.env.EMAIL,
    to:user.email,
    subject: `Registration Confirmed: ${event.name}`,
    html: `<p>Hello ${user.username},\n\nYou have successfully registered for the event: "${event.name}" on ${event.date.toDateString()} at ${event.time}.\n\nThank you!</p>`,
  });
  console.log(`Confirmation email sent to ${user.email}`);
  } catch (error) {
    console.error(`Failed to send confirmation email to ${user.email}:`, error);
  }
};
