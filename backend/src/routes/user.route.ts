import express from "express";
import { createUser } from "../controllers/user.controller";
import {
  validateBody,
  validateRequiredFields,
} from "../middlewares/validateRequest.middleware";

const router = express.Router();

router.post(
  "/",
  validateBody,
  validateRequiredFields(["userName", "fullName", "email", "password"]),
  createUser
);

export default router;
