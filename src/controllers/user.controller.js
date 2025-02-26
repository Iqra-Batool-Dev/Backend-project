import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiErrors.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const registerUser = asyncHandler( async (req , res)=>{
    // get user details from frontend
    const {fullname, email, password, username}= req.body
    console.log(email)

    // validation: if any field is empty
    if(
        [fullname, email, password, username].some((field)=>{
            field?.trim() === ""
        })
    ){
        throw new ApiError(400 , "All fields are required")
    }

    // check if user already exits: by username , password
    const existedUser = User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User is already existed")
    }

    // check for the images , check for the avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(409, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
        
    }


    // upload the images on cloudinary
    // create user object , user entry on database
    // remove password and refresh token field form response
    // check for user creation 
    // return response to client/frontend


    

})




export {registerUser}


