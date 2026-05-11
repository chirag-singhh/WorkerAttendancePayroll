import Attendance from "../models/attendance.models.js";
import Worker from "../models/worker.models.js";
import XLSX from "xlsx";

// Create Attendance
export const createAttendance = async (req, res) => {
  try {

    const {
      workerId,
      startDate,
      endDate,
      attendance,
    } = req.body;


    // Validation
    if (
      !workerId ||
      !startDate ||
      !endDate ||
      !attendance
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }


    // Find Worker
    const worker = await Worker.findById(workerId);

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found",
      });
    }


    // Calculate Total Shift
    let totalShift = 0;

    attendance.forEach((item) => {
      totalShift += Number(item.shift);
    });


    // Calculate Total Amount
    const totalAmount = totalShift * worker.rate;


    // Create Attendance
    const attendanceRecord = await Attendance.create({
      workerId,
      locationId: worker.locationId,

      startDate,
      endDate,

      attendance,

      totalShift,
      totalAmount,

      createdBy: req.user._id,
    });


    res.status(201).json({
      message: "Attendance created successfully",
      attendance: attendanceRecord,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};
export const getAttendanceByDateRange = async (
  req,
  res
) => {
  try {

    const {
      startDate,
      endDate,
      locationId,
    } = req.query;

    let filter = {};

    if (startDate && endDate) {
      filter.startDate = {
        $gte: new Date(startDate),
      };

      filter.endDate = {
        $lte: new Date(endDate),
      };
    }

    if (locationId) {
      filter.locationId = locationId;
    }

    const records = await Attendance.find(filter)
      .populate("workerId")
      .populate("locationId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: records.length,
      attendance: records,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};
export const getAttendanceByWorker = async (
  req,
  res
) => {
  try {

    const { workerId } = req.params;

    const records = await Attendance.find({
      workerId,
    })
      .populate("workerId")
      .populate("locationId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: records.length,
      attendance: records,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};
export const updateAttendance = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      startDate,
      endDate,
      attendance,
    } = req.body;

    const attendanceRecord =
      await Attendance.findById(id)
        .populate("workerId");

    if (!attendanceRecord) {
      return res.status(404).json({
        message: "Attendance not found",
      });
    }

    // Recalculate total shift
    let totalShift = 0;

    attendance.forEach((item) => {
      totalShift += Number(item.shift);
    });

    // Recalculate amount
    const totalAmount =
      totalShift * attendanceRecord.workerId.rate;

    attendanceRecord.startDate =
      startDate || attendanceRecord.startDate;

    attendanceRecord.endDate =
      endDate || attendanceRecord.endDate;

    attendanceRecord.attendance =
      attendance || attendanceRecord.attendance;

    attendanceRecord.totalShift = totalShift;

    attendanceRecord.totalAmount = totalAmount;

    const updatedAttendance =
      await attendanceRecord.save();

    res.status(200).json({
      message: "Attendance updated successfully",
      attendance: updatedAttendance,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};
export const deleteAttendance = async (req, res) => {
  try {

    const { id } = req.params;

    const attendance =
      await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        message: "Attendance not found",
      });
    }

    await attendance.deleteOne();

    res.status(200).json({
      message: "Attendance deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


export const getPayrollReport = async (
  req,
  res
) => {
  try {

    const {
      startDate,
      endDate,
      locationId,
    } = req.query;

    let filter = {};

    if (startDate && endDate) {
      filter.startDate = {
        $gte: new Date(startDate),
      };

      filter.endDate = {
        $lte: new Date(endDate),
      };
    }

    if (locationId) {
      filter.locationId = locationId;
    }

    const records = await Attendance.find(filter)
      .populate("workerId")
      .populate("locationId");

    let grandTotalShift = 0;

    let grandTotalAmount = 0;

    records.forEach((record) => {
      grandTotalShift += record.totalShift;
      grandTotalAmount += record.totalAmount;
    });

    res.status(200).json({
      count: records.length,

      grandTotalShift,

      grandTotalAmount,

      payroll: records,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

export const exportAttendanceExcel = async (req, res) => {
  try {
    const { locationId } = req.query;

    // =========================
    // FILTER QUERY
    // =========================
    const query = {};
    if (locationId) {
      query.locationId = locationId;
    }

    // =========================
    // FETCH RECORDS (ONLY ACTIVE WORKERS)
    // =========================
    const records = await Attendance.find(query)
      .populate({
        path: "workerId",
        match: { active: { $ne: false } }, // ❗ exclude deleted/inactive workers
      })
      .populate("locationId");

    // =========================
    // REMOVE NULL WORKERS (IMPORTANT)
    // =========================
    const filteredRecords = records.filter(
      (record) => record.workerId !== null
    );

    // =========================
    // GET ALL UNIQUE DATES
    // =========================
    const allDatesSet = new Set();

    filteredRecords.forEach((record) => {
      record.attendance.forEach((item) => {
        const date = new Date(item.date).toISOString().split("T")[0];
        allDatesSet.add(date);
      });
    });

    const allDates = [...allDatesSet].sort();

    // =========================
    // CREATE EXCEL DATA
    // =========================
    const excelData = filteredRecords.map((record) => {
      const row = {
        Worker: record.workerId?.name || "",
        Department: record.workerId?.department || "",
        MemberID: record.workerId?.memberId || "",
        Location: record.locationId?.name || "",
        Rate: record.workerId?.rate || 0,
      };

      // init date columns
      allDates.forEach((date) => {
        row[date] = "-";
      });

      // fill attendance
      record.attendance.forEach((item) => {
        const formattedDate = new Date(item.date)
          .toISOString()
          .split("T")[0];

        row[formattedDate] = item.shift;
      });

      // totals
      row["Total Shift"] = record.totalShift || 0;
      row["Total Amount"] = record.totalAmount || 0;

      return row;
    });

    // =========================
    // CREATE WORKBOOK
    // =========================
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Attendance Payroll"
    );

    // =========================
    // AUTO COLUMN WIDTH
    // =========================
    worksheet["!cols"] = [
      { wch: 25 }, // Worker
      { wch: 18 }, // Department
      { wch: 15 }, // MemberID
      { wch: 20 }, // Location
      { wch: 10 }, // Rate
      ...allDates.map(() => ({ wch: 12 })),
      { wch: 15 }, // Total Shift
      { wch: 18 }, // Total Amount
    ];

    // =========================
    // GENERATE FILE BUFFER
    // =========================
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // =========================
    // RESPONSE HEADERS
    // =========================
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance-payroll.xlsx"
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // =========================
    // SEND FILE
    // =========================
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};






// export const exportAttendanceExcel = async (
//   req,
//   res
// ) => {
//   try {

//     // =========================
//     // GET LOCATION ID
//     // =========================

//     const { locationId } = req.query;


//     // =========================
//     // FILTER QUERY
//     // =========================

//     const query = {};

//     if (locationId) {
//       query.locationId = locationId;
//     }


//     // =========================
//     // FETCH RECORDS
//     // =========================

//     const records = await Attendance.find(query)
//       .populate("workerId")
//       .populate("locationId");


//     // =========================
//     // GET ALL UNIQUE DATES
//     // =========================

//     const allDatesSet = new Set();

//     records.forEach((record) => {

//       record.attendance.forEach((item) => {

//         const date = new Date(item.date)
//           .toISOString()
//           .split("T")[0];

//         allDatesSet.add(date);

//       });

//     });

//     const allDates = [...allDatesSet].sort();


//     // =========================
//     // CREATE EXCEL DATA
//     // =========================

//     const excelData = records.map((record) => {

//       const row = {

//         Worker:
//           record.workerId?.name || "",

//         Department:
//           record.workerId?.department || "",

//         MemberID:
//           record.workerId?.memberId || "",

//         Location:
//           record.locationId?.name || "",

//         Rate:
//           record.workerId?.rate || 0,

//       };


//       // =========================
//       // ADD DATE COLUMNS
//       // =========================

//       allDates.forEach((date) => {

//         row[date] = "-";

//       });


//       // =========================
//       // FILL SHIFT VALUES
//       // =========================

//       record.attendance.forEach((item) => {

//         const formattedDate =
//           new Date(item.date)
//             .toISOString()
//             .split("T")[0];

//         row[formattedDate] =
//           item.shift;

//       });


//       // =========================
//       // TOTALS
//       // =========================

//       row["Total Shift"] =
//         record.totalShift || 0;

//       row["Total Amount"] =
//         record.totalAmount || 0;

//       return row;

//     });


//     // =========================
//     // CREATE WORKBOOK
//     // =========================

//     const workbook =
//       XLSX.utils.book_new();

//     const worksheet =
//       XLSX.utils.json_to_sheet(
//         excelData
//       );

//     XLSX.utils.book_append_sheet(
//       workbook,
//       worksheet,
//       "Attendance Payroll"
//     );


//     // =========================
//     // AUTO COLUMN WIDTH
//     // =========================

//     worksheet["!cols"] = [

//       { wch: 25 }, // Worker
//       { wch: 18 }, // Department
//       { wch: 15 }, // MemberID
//       { wch: 20 }, // Location
//       { wch: 10 }, // Rate

//       ...allDates.map(() => ({
//         wch: 12,
//       })),

//       { wch: 15 }, // Total Shift
//       { wch: 18 }, // Total Amount

//     ];


//     // =========================
//     // GENERATE BUFFER
//     // =========================

//     const excelBuffer =
//       XLSX.write(workbook, {
//         type: "buffer",
//         bookType: "xlsx",
//       });


//     // =========================
//     // RESPONSE HEADERS
//     // =========================

//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=attendance-payroll.xlsx"
//     );

//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );


//     // =========================
//     // SEND FILE
//     // =========================

//     res.send(excelBuffer);

//   } catch (error) {

//     res.status(500).json({
//       message: error.message,
//     });

//   }
// };