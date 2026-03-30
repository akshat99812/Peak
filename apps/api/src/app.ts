import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Router } from "express";

import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { errorHandler } from "./middleware/error.middleware";
import { notFound } from "./middleware/notFound.middleware";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

app.use(notFound);
app.use(errorHandler);

export const userRouter = Router();
export default app;