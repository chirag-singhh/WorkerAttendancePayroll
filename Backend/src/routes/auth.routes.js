import express from 'express'
import { loginUser, registerUser ,getMe,logoutUser} from '../controllers/auth.controllers.js'
import { protect } from '../middlewares/auth.middlewares.js';
const router = express.Router();

router.post("/register",registerUser);
router.post("/login",loginUser);    
router.get("/me", protect, getMe);
router.post("/logout", logoutUser);



export default router;