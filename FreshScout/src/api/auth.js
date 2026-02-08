import { http } from "./http";

export const requestCode = (phone) =>
  http.post("/api/auth/request-code", { phone }).then(r => r.data);

export const verifyCode = (phone, code, name) =>
  http.post("/api/auth/verify-code", { phone, code, name }).then(r => r.data);
