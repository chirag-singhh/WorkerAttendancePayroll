import jwt from 'jsonwebtoken';
import User from '../models/user.models.js'


export const protect = async (req,res,next)=>{
    try {
        let token = req.cookies.token;
        if(!token){
            return res.status(401).json({
                    message: "Not authorized, no token",
            })
        }
            // Verify Token

         const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Find User
    const user = await User.findById(decoded.id).select("-password");


    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }


    // Attach user to request
    req.user = user;

    next();
        
    } catch (error) {
        
    res.status(401).json({
      message: "Invalid token",
    });
    }
}