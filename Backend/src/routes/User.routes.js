import { Router } from "express";
import {
  signupUser,
  loginUser,
  getCurrentUser,
  getCourse,
  checkCourseAccess,
  getEnrolledCourses,
  forgotPassword
} from "../controllers/User.controller.js";
const router = Router();

router.use((req, res, next) => {
  console.log('Request:', req.method, req.url, req.body);
  next();
});

router.route("/signup").post(signupUser);
router.route("/login").post(loginUser);
router.route("/me").get(getCurrentUser);
router.route("/courses").get(getCourse);
router.get("/enrolled-courses", (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  next();
}, getEnrolledCourses);
router.get('/courses/:courseId/access', checkCourseAccess);
router.post("/forgot-password", forgotPassword);

export default router;