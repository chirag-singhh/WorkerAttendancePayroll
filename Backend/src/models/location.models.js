import mongoose from 'mongoose'

const locationSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
    },
     address:{
        type:String,
        required:true,
        trim:true,
    },
     createdBy:{
          type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
},{timestamps:true})

const Location = mongoose.model("Location",locationSchema)

export default Location;