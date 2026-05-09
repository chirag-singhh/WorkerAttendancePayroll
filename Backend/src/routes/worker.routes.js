import express from "express";

import { protect } from "../middlewares/auth.middlewares.js";
import { createWorker,getWorkers,updateWorker,deleteWorker,toggleWorkerStatus} from "../controllers/worker.controllers.js";

const router = express.Router();


// Create Worker
// router.post("/", protect, createWorker);

// Create Worker
router.post("/", protect, createWorker);


// Get All Workers
router.get("/", protect, getWorkers);


// Update Worker
router.put("/:id", protect, updateWorker);


// Delete Worker
router.delete("/:id", protect, deleteWorker);


// Toggle Active/Inactive
router.patch("/toggle-status/:id", protect, toggleWorkerStatus);


export default router;



