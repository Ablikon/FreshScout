export async function sendSms(phone, text) {
  if (process.env.OTP_DEV_MODE === "true") {
    console.log(`📩 [DEV SMS] ${phone}: ${text}`);
    return;
  }
  throw new Error("SMS provider not configured");
}
