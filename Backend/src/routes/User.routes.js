import { Router } from "express";
import { signupUser, loginUser, getCurrentUser } from "../controllers/User.controller.js";

const router = Router();

router.route("/signup").post(signupUser);
router.route("/login").post(loginUser);
router.route("/me").get(getCurrentUser);

export default router;