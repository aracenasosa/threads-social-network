import express from "express";
import userRouter from "./routes/user.route";
import postRouter from "./routes/post.route";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);

export default app;
