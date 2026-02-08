import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import OtpCode from '../models/OtpCode.js';
import User from '../models/User.js';
import { sendOtp } from '../services/sms.service.js';

/**
 * POST /api/auth/send-otp
 * Body: { phone }
 */
export async function sendOtpHandler(req, res) {
  try {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Введите корректный номер телефона' });
    }

    // Generate 4-digit OTP
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const codeHash = await bcrypt.hash(code, 10);

    // Remove old OTPs for this phone
    await OtpCode.deleteMany({ phone });

    // Save new OTP
    await OtpCode.create({ phone, codeHash, attemptsLeft: 3 });

    // Send OTP (dev mode: logs to console)
    await sendOtp(phone, code);

    res.json({ success: true, message: 'Код отправлен' });
  } catch (error) {
    console.error('sendOtp error:', error);
    res.status(500).json({ error: 'Ошибка отправки кода' });
  }
}

/**
 * POST /api/auth/verify-otp
 * Body: { phone, code }
 */
export async function verifyOtpHandler(req, res) {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Телефон и код обязательны' });
    }

    const otpRecord = await OtpCode.findOne({ phone });
    if (!otpRecord) {
      return res.status(400).json({ error: 'Код не найден или истек' });
    }

    if (otpRecord.attemptsLeft <= 0) {
      await OtpCode.deleteMany({ phone });
      return res.status(400).json({ error: 'Превышено количество попыток' });
    }

    const isValid = await bcrypt.compare(code, otpRecord.codeHash);
    if (!isValid) {
      otpRecord.attemptsLeft -= 1;
      await otpRecord.save();
      return res.status(400).json({ 
        error: 'Неверный код', 
        attemptsLeft: otpRecord.attemptsLeft 
      });
    }

    // OTP valid - cleanup
    await OtpCode.deleteMany({ phone });

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        city: user.city,
      },
    });
  } catch (error) {
    console.error('verifyOtp error:', error);
    res.status(500).json({ error: 'Ошибка верификации' });
  }
}
