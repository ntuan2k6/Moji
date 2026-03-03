import jwt from 'jsonwebtoken'; 
import User from '../models/Users.js'; 
import dotenv  from 'dotenv';
dotenv.config(); 

const protectedRoute  = (req, res, next) => {
    try {
        // lấy token từ header 
        const authHeader = req.headers['authorization']; 
        // lấy token trong header
        const token = authHeader && authHeader.split(" ")[1]; 
        if (!token) {
            return res.status(401).json({message: 'Không tìm thấy access token'})
        }
        // verify token
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async(error, decodeduser)=>{
            if (error) {
                console.log(error);
                // lỗi 
                return res.status(403).json({messages: "access token hết hạn hoặc không đúng"});
            }
            const user = await User.findById(decodeduser.userId).select('-hashedPassword');
            if(!user) {
                return res.status(404).json({message: "user không tồn tại"}); 
            }
            req.user = user; 
            next(); 
        } );
    } catch (error) {
        console.log("error");
        return res.status(500).json({}); 
    }
}

export default protectedRoute; 