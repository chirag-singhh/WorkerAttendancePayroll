import Location from '../models/location.models.js'

export const createLocation = async (req,res) => {
    try {
        const {name,address} = req.body;

        if(!name || !address){
            return    res.status(500).json({
      message: "All fields required",
    });
        }

        const location = await Location.create({
            name,
            address,
            createdBy:req.user._id,
        })

        res.status(201).json({
      message: "Location created successfully",
      location,
    });


    } catch (error) {
          res.status(500).json({
      message: error.message,
    });
    }
}

export const getLocation = async (req,res) => {
    try {
         const locations = await Location.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: locations.length,
      locations,
    });
    } catch (error) {
         res.status(500).json({
      message: error.message,
    });
    }
}

export const updateLocation = async (req, res) => {
  try {

    const { id } = req.params;

    const { name, address } = req.body;


    // Find Location
    const location = await Location.findById(id);

    if (!location) {
      return res.status(404).json({
        message: "Location not found",
      });
    }


    // Update Fields
    location.name = name || location.name;

    location.address = address || location.address;


    // Save Updated Location
    const updatedLocation = await location.save();


    res.status(200).json({
      message: "Location updated successfully",
      location: updatedLocation,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


export const deleteLocation = async (req, res) => {
  try {

    const { id } = req.params;


    // Find Location
    const location = await Location.findById(id);

    if (!location) {
      return res.status(404).json({
        message: "Location not found",
      });
    }


    // Delete Location
    await location.deleteOne();


    res.status(200).json({
      message: "Location deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};