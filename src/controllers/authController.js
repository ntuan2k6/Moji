import bcrypt from 'bcrypt';
import User from '../models/Users.js';
import Session from '../models/Session.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; 
const ACCESS_TOKEN_TTL = "30m";
const REFREST_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;  // thời gian refrest token

// signUp
export const signUp = async (req, res) => {
    try {
        const { username, password, email, firstname, lastname } = req.body;
        if (!username || !password || !email || !firstname || !lastname) {
            res.status(400).json({ message: "Không thể thiếu username, password, email, firstname, lastname" })
        }
        const usernameDupticate = await User.findOne({ username });
        if (usernameDupticate) return res.status(409).json({ message: "username đã tồn tại" });
        // mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        // tạo user mới
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${firstname} ${lastname}`
        });

        return res.sendStatus(204);
    } catch (error) {
        console.error("lỖI đăng ký"); 
        console.log(error);
        return res.status(500).json({message: "lỗi hệ thống"});
    }
}


export const signIn = async (req, res) => {
try {
    // inputs
    const {username, password} = req.body; 

    if (!username || !password) {
        return res.status(400).json({message: "Thiếu username hoặc password"}); 
    }

    // so sánh database
    const user = await User.findOne({username}); 
    if(!user) {
        return res.status(401).json({message: "username hoặc password không chính xác"});
    } 

    const passsWordCorrect = await bcrypt.compare(password, user.hashedPassword);
    if (!passsWordCorrect) {
        return res.status(401).json({ message: "username hoặc password không chính xác" });
    } 
    // tạo access Token
    const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL })
    // tạo refresh token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    //tạo sessions mới 
    await Session.create({
        userId: user._id,
        refreshToken,
        expiresAt: new Date(Date.now() + REFREST_TOKEN_TTL),
    }); 

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, 
        secure:true, 
        sameSite: "none",
        maxAge: REFREST_TOKEN_TTL
    });

    return res.status(200).json({message: `User ${user.displayName} đã login`, accessToken})
} catch (error) {
    console.error("lỖI đăng nhập");
    console.log(error);
    return res.status(500).json({ message: "lỗi hệ thống" });
}

}


export const logOut = async(req, res) => {
try {
    // lấy refreshToken từ cookie
    const token = req.cookie?.refreshToken; 
    if(token) {
        //xóa refreshToken trong sessions
        await Session.deleteOne({ refreshToken: token }); 
        //xóa refreshToken trong cookie
        req.clearCookie("refreshToken");
    }

    return res.status(204); 
    
} catch (error) {
    console.error("lỗI đăng xuất");
    console.log(error);
    return res.status(500).json({ message: "lỗi hệ thống" });
}
}