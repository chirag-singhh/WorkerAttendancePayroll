import express from "express";

import { protect } from "../middlewares/auth.middlewares.js";

import {
   createAttendance,
  getAttendanceByDateRange,
  getAttendanceByWorker,
  updateAttendance,
  deleteAttendance,
  getPayrollReport,
  exportAttendanceExcel,
} from "../controllers/attendance.controllers.js";

const router = express.Router();


// Create Attendance
router.post("/", protect, createAttendance);

// Get Attendance By Date Range
router.get("/", protect, getAttendanceByDateRange);


// Get Attendance By Worker
router.get(
  "/worker/:workerId",
  protect,
  getAttendanceByWorker
);


// Update Attendance
router.put("/:id", protect, updateAttendance);


// Delete Attendance
router.delete("/:id", protect, deleteAttendance);


// Payroll Report
router.get(
  "/payroll/report",
  protect,
  getPayrollReport
);


// Export Excel
router.get(
  "/export/excel",
  protect,
  exportAttendanceExcel
);


export default router;