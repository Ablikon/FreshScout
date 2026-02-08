// SMS service - dev mode just logs OTP to console
export function sendOtp(phone, code) {
  console.log(`📱 OTP for ${phone}: ${code}`);
  return Promise.resolve({ success: true });
}

export default { sendOtp };
