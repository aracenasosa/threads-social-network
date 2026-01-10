import express from "express";
import userRouter from "./routes/user.route";
import postRouter from "./routes/post.route";
import likeRouter from "./routes/like.route";
import authRouter from "./routes/auth.route";
import morgan from "morgan";

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/likes", likeRouter);
app.use("/api/auth", authRouter);

export default app;
