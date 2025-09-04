import { Router } from "express";
import {signupUser,loginUser,getCurrentUser,getCourse} from "../controllers/User.controller.js"
const router = Router();

router.route("/signup").post(signupUser);
router.route("/login").post(loginUser);
router.route("/me").get(getCurrentUser);
router.route("/courses").get(getCourse)

export default router;