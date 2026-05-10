import User from "../models/user.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const registerUser = async (req, res) => {
  try {

    // Collect User Data
    const { name, email, password } = req.body;


    // Check Existing User
    const checkExistingUser = await User.findOne({ email });

    if (checkExistingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }


    // Hash Password
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);


    // Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });


    // Generate Token
    const token = generateToken(user._id);


    // Store Token in Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    // Response
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


export const loginUser = async (req,res) => {

  try {
      const {email,password} = req.body;

      const user = await User.findOne({email});
      if(!user){
        return res.status(400).json({
          message:"Invalid Login Crendentials"
        })
      }

      // password match
      const isMatch = await bcrypt.compare(password,user.password)
      if(!isMatch){
  return res.status(400).json({
        message: "Invalid email or password",
      });
      }

       const token = generateToken(user._id);
      // Store Token in Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

     res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    
    res.status(500).json({
      message: error.message,
    });
  }
  
}

export const getMe = async (req, res) => {

  res.status(200).json({
    user: req.user,
  });

};


export const logoutUser = async (req, res) => {

  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    message: "Logged out successfully",
  });

};