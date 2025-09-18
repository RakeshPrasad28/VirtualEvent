import dotenv from "dotenv";
dotenv.config();
import  express from 'express';
import connectDB from "./config/db.js";
import authRouter from "./routes/auth.js";

const app = express();
app.use(express.json());

// app.get("/",(req,res)=>{
//     res.send("Hello")
// })

app.use('/api/auth', authRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>{
    connectDB();
    console.log(`Server running on port ${PORT}`)
})
