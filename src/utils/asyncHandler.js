// asyncHandler using promise method

const asyncHandler = (requestHandler)=>{
    return (req, res, next)=>{
        Promise.resolve(requestHandler(req, res , next)).catch((error)=> next(error))
    }
}








export {asyncHandler};


// asyncHandler using try catch

// const asyncHandler = (requestHandler)=> async(req, res, next)=>{
//     try{
//         await requestHandler(req, res, next);
//     }
//     catch(error) {
//         next(error);
//     }
// }

