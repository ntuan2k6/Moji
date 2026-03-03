//server.js
import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './lib/db.js';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js'; 
import protectedRoute from './middlewares/authMiddleware.js';
import cookieParser from 'cookie-parser'; 
dotenv.config();
const app = express();
const port = process.env.PORT || 5001;

//middleware 
app.use(express.json());
app.use(cookieParser()); 

//public route
app.use('/api/auth', authRoute); 


//private route

//middleware private route
app.use(protectedRoute);

app.use("/api/user", userRoute);


connectDB().then(()=> {
    app.listen(port, () => {
        console.log(`server is running in port = ${port}`);
    })
})


