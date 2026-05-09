import express from "express";
import { protect } from "../middlewares/auth.middlewares.js";
import {  createLocation, getLocation,updateLocation,deleteLocation} from "../controllers/location.controllers.js";

const router = express.Router();


// Create Location
router.post("/", protect, createLocation);
router.get("/", protect, getLocation);
router.put("/:id", protect, updateLocation);
router.delete("/:id", protect, deleteLocation);

export default router;