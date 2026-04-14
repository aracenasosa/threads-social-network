import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import swaggerSpec from "./config/swagger";
import { globalLimiter } from "./middlewares/rateLimiter";

// Routes
import userRouter from "./routes/user.route";
import postRouter from "./routes/post.route";
import likeRouter from "./routes/like.route";
import authRouter from "./routes/auth.route";
import logger from "./utils/logger";
import { isDev, isTest } from "./utils/env";

const app = express();

/**
 * ==============================================================================
 * SECURITY CONFIGURATION & MIDDLEWARES
 * ==============================================================================
 */

// Trust the first proxy. This is REQUIRED if you are behind a reverse proxy (Heroku, Vercel, AWS ELB, Nginx).
// It allows express-rate-limit to see the real user IP instead of the proxy's IP.
app.set("trust proxy", 1);

const allowedOriginsStr = process.env.ALLOWED_ORIGINS;
if (!allowedOriginsStr) {
  throw new Error("ALLOWED_ORIGINS environment variable is not defined");
}

const allowedOrigins = allowedOriginsStr
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

// Security Middlewares (CORS, Rate Limiter)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin only in development (like mobile apps or curl requests)
      if (!origin) {
        if (isDev() || isTest()) {
          return callback(null, true);
        } else {
          const msg = "Not allowed by CORS";
          logger.error(msg);
          return callback(new Error(msg));
        }
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        logger.error(msg);
        callback(new Error(msg), false);
      }
    },
    credentials: true,
  }),
);

app.use(globalLimiter);

// Logging and Parsing
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * ==============================================================================
 * ROUTES
 * ==============================================================================
 */

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//Health Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/likes", likeRouter);

export default app;
