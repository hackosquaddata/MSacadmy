import { Router } from "express";
import {createCourse,upload,deleteCourse,editCourse,getCourses,getCourseById}  from "../controllers/Admin.controller.js"

const router = Router();

router.post("/coursecreation", upload.single("thumbnail"), createCourse);
router.put("/courses/:id", upload.single("thumbnail"), editCourse);
router.delete("/courses/:id", deleteCourse);
router.get("/courses", getCourses);
router.get("/courses/:id", getCourseById); // ✅ For prefill in edit mode



export default router


