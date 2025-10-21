import { Router } from "express";
import {createCourse, upload, deleteCourse, editCourse, getCourses, getCourseById, uploadCourseContent,getCourseContents,deleteCourseContent, getDashboardStats, listEnrollmentsByCourse, revokeEnrollment}  from "../controllers/Admin.controller.js"

const router = Router();

// Accept both thumbnail and certification preview images
router.post(
	"/coursecreation",
	upload.fields([
		{ name: "thumbnail", maxCount: 1 },
		{ name: "certification_preview", maxCount: 1 }
	]),
	createCourse
);
router.put(
	"/courses/:id",
	upload.fields([
		{ name: "thumbnail", maxCount: 1 },
		{ name: "certification_preview", maxCount: 1 }
	]),
	editCourse
);
router.delete("/courses/:id", deleteCourse);
router.get("/courses", getCourses);
router.get("/courses/:id", getCourseById); // ✅ For prefill in edit mode
router.post("/courses/:courseId/contents", upload.single("file"), uploadCourseContent);
router.get("/courses/:courseId/contents", getCourseContents);

// Admin: enrollments
router.get('/courses/:courseId/enrollments', listEnrollmentsByCourse);
router.delete('/enrollments/:enrollmentId', revokeEnrollment);

// Delete individual content
router.delete("/courses/contents/:contentId", deleteCourseContent);
router.get("/dashboard/stats", getDashboardStats);

export default router


