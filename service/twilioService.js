import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhone) {
  throw new Error("Twilio configuration is missing in environment variables");
}

const client = twilio(accountSid, authToken);

export async function sendOtpSms(mobile, otp) {
  return client.messages.create({
    body: `Your OTP code is ${otp}`,
    from: +17756183002,
    to: +918828382326,
  });
}
