import { Router } from "express";
import {createCourse,upload}  from "../controllers/Admin.controller.js"

const router = Router();


router.route("/coursecreation").post(upload.single("thumbnail"),createCourse);


export default router


