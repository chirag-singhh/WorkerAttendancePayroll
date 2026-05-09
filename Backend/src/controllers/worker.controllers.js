import Worker from "../models/worker.models.js";
import Location from "../models/location.models.js";


// Create Worker
export const createWorker = async (req, res) => {
  try {

    const {
      name,
      department,
      customDepartment,
      memberId,
      rate,
      phone,
      locationId,
    } = req.body;


    // Validation
    if (
      !name ||
      !department ||
      !memberId ||
      !rate ||
      !locationId
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }


    // Check Existing Worker
    const existingWorker = await Worker.findOne({ memberId });

    if (existingWorker) {
      return res.status(400).json({
        message: "Member ID already exists",
      });
    }


    // Check Location
    const location = await Location.findById(locationId);

    if (!location) {
      return res.status(404).json({
        message: "Location not found",
      });
    }


    // Create Worker
    const worker = await Worker.create({
      name,
      department,
      customDepartment,
      memberId,
      rate,
      phone,
      locationId,
      createdBy: req.user._id,
    });


    res.status(201).json({
      message: "Worker created successfully",
      worker,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

export const getWorkers = async (req, res) => {
  try {

    const { locationId, active } = req.query;

    let filter = {};

    // Filter by location
    if (locationId) {
      filter.locationId = locationId;
    }

    // Filter by active status
    if (active !== undefined) {
      filter.active = active === "true";
    }

    const workers = await Worker.find(filter)
      .populate("locationId", "name address")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: workers.length,
      workers,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

export const updateWorker = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      name,
      department,
      customDepartment,
      memberId,
      rate,
      phone,
      locationId,
      active,
    } = req.body;


    // Find Worker
    const worker = await Worker.findById(id);

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found",
      });
    }


    // Check Duplicate Member ID
    if (memberId && memberId !== worker.memberId) {

      const existingWorker = await Worker.findOne({ memberId });

      if (existingWorker) {
        return res.status(400).json({
          message: "Member ID already exists",
        });
      }
    }


    // Check Location
    if (locationId) {

      const location = await Location.findById(locationId);

      if (!location) {
        return res.status(404).json({
          message: "Location not found",
        });
      }
    }


    // Update Fields
    worker.name = name || worker.name;

    worker.department = department || worker.department;

    worker.customDepartment =
      customDepartment || worker.customDepartment;

    worker.memberId = memberId || worker.memberId;

    worker.rate = rate || worker.rate;

    worker.phone = phone || worker.phone;

    worker.locationId = locationId || worker.locationId;

    if (active !== undefined) {
      worker.active = active;
    }


    // Save
    const updatedWorker = await worker.save();


    res.status(200).json({
      message: "Worker updated successfully",
      worker: updatedWorker,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


export const deleteWorker = async (req, res) => {
  try {

    const { id } = req.params;

    const worker = await Worker.findById(id);

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found",
      });
    }

    await worker.deleteOne();

    res.status(200).json({
      message: "Worker deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

export const toggleWorkerStatus = async (req, res) => {
  try {

    const { id } = req.params;

    const worker = await Worker.findById(id);

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found",
      });
    }

    worker.active = !worker.active;

    await worker.save();

    res.status(200).json({
      message: `Worker ${
        worker.active ? "activated" : "deactivated"
      } successfully`,
      worker,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};