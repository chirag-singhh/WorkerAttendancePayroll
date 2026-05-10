import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMDA3NzNhZWMyNDNmMzdkN2YyNzFmMCIsImlhdCI6MTc3ODQxNTYxNCwiZXhwIjoxNzc5MDIwNDE0fQ.DNCX0g-4DyPqhNJ73jIJcJNolfGdfSwkklyN4x9z62U";

const departments = [
  "Mistry",
  "Carpenter",
  "Assistant",
  "Painter",
  "Tiles",
];

const workerNames = [
  "Ramesh",
  "Suresh",
  "Mahesh",
  "Akash",
  "Vikas",
  "Rahul",
  "Aman",
  "Karan",
  "Raju",
  "Deepak",
  "Sonu",
  "Monu",
  "Arjun",
  "Ritik",
  "Vijay",
];

const shifts = [0, 1, 1.5, 2, 2.5, 3];

const randomShift = () => {
  return shifts[Math.floor(Math.random() * shifts.length)];
};

const randomDept = () => {
  return departments[
    Math.floor(Math.random() * departments.length)
  ];
};

const createDummyData = async () => {
  try {

    // =========================
    // CREATE LOCATION
    // =========================

    const locationRes = await axios.post(
      `${BASE_URL}/location`,
      {
        name: "Demo Site",
        address: "Mumbai",
      },
      {
        headers: {
          Cookie: `token=${token}`,
        },
      }
    );

    const locationId =
      locationRes.data.location._id;

    console.log("Location Created");


    // =========================
    // CREATE 15 WORKERS
    // =========================

    for (let i = 0; i < 15; i++) {

      const workerRes = await axios.post(
        `${BASE_URL}/worker`,
        {
          name: workerNames[i],

          department: randomDept(),

          customDepartment: "",

          memberId: `MEM${Date.now()}${i}`,

          rate:
            700 +
            Math.floor(Math.random() * 1000),

          phone: `98765432${i}${i}`,

          locationId,
        },
        {
          headers: {
            Cookie: `token=${token}`,
          },
        }
      );

      const workerId =
        workerRes.data.worker._id;

      console.log(
        `Worker Created: ${workerNames[i]}`
      );


      // =========================
      // CREATE ATTENDANCE
      // =========================

      const attendanceArray = [];

      for (let d = 1; d <= 7; d++) {

        attendanceArray.push({
          date: `2026-05-0${d}`,
          shift: randomShift(),
        });
      }

      await axios.post(
        `${BASE_URL}/attendance`,
        {
          workerId,

          startDate: "2026-05-01",

          endDate: "2026-05-07",

          attendance: attendanceArray,
        },
        {
          headers: {
            Cookie: `token=${token}`,
          },
        }
      );

      console.log(
        `Attendance Added: ${workerNames[i]}`
      );
    }

    console.log(
      "\n✅ Dummy Data Generated Successfully"
    );

  } catch (error) {

    console.log(
      error.response?.data || error.message
    );

  }
};

createDummyData();