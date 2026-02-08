import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OtpCode from "../models/OtpCode.js";
import { sendSms } from "../services/sms.service.js";

function normalizePhone(raw) {
  let s = String(raw || "").trim().replace(/\s+/g, "");
  if (/^8\d{10}$/.test(s)) s = "+7" + s.slice(1);
  return s;
}
function genCode4() {
  return String(Math.floor(1000 + Math.random() * 9000)); 
}

export async function requestCode(req, res) {
  const phone = normalizePhone(req.body.phone);
  if (!/^\+7\d{10}$/.test(phone)) {
    return res.status(400).json({ message: "invalid phone" });
  }

  const code = genCode4();
  const codeHash = await bcrypt.hash(code, 10);
  const ttl = Number(process.env.OTP_TTL_SECONDS || 180);
  const expiresAt = new Date(Date.now() + ttl * 1000);

  await OtpCode.deleteMany({ phone });
  await OtpCode.create({ phone, codeHash, attemptsLeft: 5, expiresAt });

  await sendSms(phone, `Код входа: ${code}`);

  const resp = { ok: true, ttlSeconds: ttl };
  if (process.env.OTP_DEV_MODE === "true") resp.devCode = code;
  res.json(resp);
}

export async function verifyCode(req, res) {
  const phone = normalizePhone(req.body.phone);
  const code = String(req.body.code || "").trim();
  const name = String(req.body.name || "").trim();

  if (!/^\+7\d{10}$/.test(phone) || !/^\d{4}$/.test(code) || !name) {
    return res.status(400).json({ message: "invalid payload" });
  }

  const rec = await OtpCode.findOne({ phone });
  if (!rec) return res.status(400).json({ message: "code expired or not requested" });
  if (rec.attemptsLeft <= 0) {
    await OtpCode.deleteMany({ phone });
    return res.status(429).json({ message: "too many attempts" });
  }

  const ok = await bcrypt.compare(code, rec.codeHash);
  if (!ok) {
    rec.attemptsLeft -= 1;
    await rec.save();
    return res.status(400).json({ message: "invalid code", attemptsLeft: rec.attemptsLeft });
  }

  await OtpCode.deleteMany({ phone });

  let user = await User.findOne({ phone });
  if (!user) user = await User.create({ phone, name });
  else if (user.name !== name) {
    user.name = name;
    await user.save();
  }

  const token = jwt.sign(
    { userId: user._id.toString(), phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user: { id: user._id, phone: user.phone, name: user.name } });
}
