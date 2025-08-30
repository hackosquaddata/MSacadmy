import { Router } from "express";
import {signupUser} from "../controllers/User.controller.js"


const router =Router()

router.route("/SignUp").post(signupUser)


export default router