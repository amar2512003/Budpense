import nodemailer from "nodemailer";

import env from "../config/env.js";

// One transporter for the process. Gmail is happy to reuse a single
// authenticated connection across requests rather than logging in per email.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: env.emailUser, pass: env.emailPass },
});

/**
 * Sends the password-reset OTP. Kept to one job: callers decide what to do if
 * this throws, since a mail failure should never change what the API tells
 * the caller about whether an account exists.
 */
export async function sendResetOtpEmail(to, name, otp) {
  await transporter.sendMail({
    from: `"Budpense" <${env.emailFrom}>`,
    to,
    subject: "Your Budpense password reset code",
    text:
      `Hi ${name},\n\n` +
      `Your password reset code is ${otp}. It expires in 10 minutes.\n\n` +
      `If you didn't request this, you can ignore this email.`,
    html:
      `<p>Hi ${name},</p>` +
      `<p>Your password reset code is:</p>` +
      `<p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otp}</p>` +
      `<p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}

export default transporter;
