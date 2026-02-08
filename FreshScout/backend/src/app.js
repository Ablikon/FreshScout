import express from "express";
import cors from "cors";

import ordersRoutes from "./routes/orders.routes.js";
import authRoutes from "./routes/auth.routes.js";
import meRoutes from "./routes/me.routes.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/orders", ordersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);

export default app;
