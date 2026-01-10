import { Router } from "express";
import {
  validateBody,
  validateRequiredFields,
} from "../middlewares/validateRequest.middleware";
import { loginUser, logoutUser } from "../controllers/auth.controller";

const router = Router();

router.post(
  "/login",
  validateBody,
  validateRequiredFields(["userNameOrEmail", "password"]),
  loginUser
);

router.post(
  "/logout",
  validateBody,
  validateRequiredFields(["userNameOrEmail"]),
  logoutUser
);

export default router;
