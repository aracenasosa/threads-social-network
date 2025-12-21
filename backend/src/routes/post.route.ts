import { Router } from "express";
import {
  createPost,
  getFeed,
  getPostThread,
} from "../controllers/post.controller";
import { enforceTotalUploadSize, uploadManyOrAny } from "../middlewares/upload";
import { validateFormData } from "../middlewares/validateFormData";

const route = Router();

route.post(
  "/",
  uploadManyOrAny,
  enforceTotalUploadSize,
  validateFormData({ fields: ["author", "text"], requireFiles: false }),
  createPost
);

route.get("/feed", getFeed);
route.get("/:id/thread", getPostThread);

export default route;
