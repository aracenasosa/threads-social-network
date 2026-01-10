import express from "express";
import {
  createUser,
  getUserById,
  getUsers,
  removeUser,
  updateUser,
} from "../controllers/user.controller";
import {
  validateBody,
  validateRequiredFields,
} from "../middlewares/validateRequest.middleware";
import { uploadSingle } from "../middlewares/upload";
import {
  validateFormData,
  validateFormDataIsNotEmpty,
} from "../middlewares/validateFormData";

const router = express.Router();

router.get("/", getUsers);

router.get("/:id", getUserById);

router.post(
  "/",
  uploadSingle.single("profilePhoto"),
  validateFormData({
    fields: ["userName", "fullName", "email", "password"],
  }),
  createUser
);

router.delete("/delete/:id", removeUser);

router.patch(
  "/update/:id",
  uploadSingle.single("profilePhoto"),
  validateFormDataIsNotEmpty,
  updateUser
);

export default router;
