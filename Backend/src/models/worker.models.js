import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      enum: [
        "Mistry",
        "Carpenter",
        "Assistant",
        "Painter",
        "Extra",
        "Tiles",
        "Rustom",
        "Molder",
        "Custom",
      ],
    },

    customDepartment: {
      type: String,
      trim: true,
      default: "",
    },

    memberId: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },

    rate: {
      type: Number,
      required: true,
    },

    phone: {
      type: String,
      default: "",
      required:false,
    },

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    active: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Worker = mongoose.model("Worker", workerSchema);

export default Worker;