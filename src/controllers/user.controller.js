import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiErrors.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"



const generateAccessAndRefreshToken = async (userId) =>{
    try{
        const user = await User.findById(userId)
        const accessToken =  user.generateAccessToken()
        const refreshToken =  user.generateRefreshToken()
        user.refreshToken = refreshToken

        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    }
    catch{
        throw new ApiError(500, "something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler( async (req , res)=>{
    // get user details from frontend
    const {fullname, email, password, username}= req.body

    // validation: if any field is empty
    if(
        [fullname, email, password, username].some((field)=>{
            field?.trim() === ""
        })
    ){
        throw new ApiError(400 , "All fields are required")
    }

    // check if user already exits: by username , password
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    // console.log(existedUser)

    if(existedUser){
        throw new ApiError(409, "User is already existed")
    }

    // check for the images , check for the avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0 ){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(409, "Avatar is required")
    }

    // upload the images on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    // console.log(avatar)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
        
    }

    // create user object , user entry on database
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // check for user creation , remove password and refresh token field form response
    const createdUser = await User.findById(user._id).select(" -password -refreshToken")
    console.log(createdUser)

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return response to client/frontend
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
    

})


const loginUser = asyncHandler(async(req , res)=>{
    console.log(req.body) 
    // get user data 
        const {username, email, password} = req.body
        
    // check if username, email , password is empty
        if(!(username || email)){
            throw new ApiError(400, "username or email is required")
        }
    // find user
        const user = await User.findOne({
            $or: [{username}, {email}]
        })
        if(!user){
            throw new ApiError(404, "user does not exist")
        }
    // password check 
        const isPasswordValid= user.isPasswordCorrect(password)
        if(!isPasswordValid){
            throw new ApiError(401, "invalid password")
        }

    // access and refresh token 
        const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)
        
        // console.log("token obj: ",tokens)
        const  loggedInUser = await User.findOne(user._id).select(" -password -refreshToken")
    // send cookie
        const options= {
            httpOnly: true,
            secure: true
        }
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "user loggedIn successfully"
            )
        )
        
})


const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options= {
        httpOnly: true,
        secure: true
    }

    return res 
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged Out"))
})


const refreshAccessToken = asyncHandler(async(req,  res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401, "Invalid refresh token")
    }
    if(incomingRefreshToken !== user.refreshToken){
        throw new ApiError(401, "Refresh token is expired or used")
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    const options = {
        httpOnly: true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken , options)
    .cookie("refreshToken" , newRefreshToken , options)
    .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken:newRefreshToken},
            "access token refreshed successfully"
        )
    )
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "invalid password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res)=>{

    return res
    .status(200)
    .json(new ApiResponse(200, req.user , "current user fetched successfully"))
})

const updateUserDetails = asyncHandler(async(req, res)=>{
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200),
    json(new ApiResponse(200, user , "Account details updated successfully "))
})

const updateAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400, "error while uploading on avatar ")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar : avatar.url 
            },
        },
        {new : true}
    ).select("-password")

    return res 
    .status(200)
    .json( new ApiResponse(200, user, "Avatar updated successfully "))
})


const updateCoverImage  = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400, "error while uploading on coverImage ")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage : coverImage.url 
            },
        },
        {new : true}
    ).select("-password")

    return res 
    .status(200)
    .json( new ApiResponse(200, user, "coverImage updated successfully "))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateAvatar,
    updateCoverImage
}


