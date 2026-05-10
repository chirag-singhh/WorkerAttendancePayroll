import express from "express";
import dotenv from "dotenv";
import cookieparser from "cookie-parser";
import cors from "cors";
import connectDb from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import locationRoutes from "./routes/location.routes.js"
import workerRoutes from "./routes/worker.routes.js"
import attendanceRoutes from "./routes/attendance.routes.js"
dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieparser());
app.use(
  cors({
    origin: ["http://localhost:5173","https://worker-attendance-payroll.vercel.app/login"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  }),
);

// routes
app.use("/api/auth",authRoutes)
app.use("/api/location",locationRoutes)
app.use("/api/worker", workerRoutes);
app.use("/api/attendance", attendanceRoutes);

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("Server is running on-" + port);
});

connectDb();
//Server Testing
app.get("/", (req, res) => {
  res.send("Worker Attendance API Running...");
});
