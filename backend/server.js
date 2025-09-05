const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const pool = require("./db"); // Import the database pool
const http = require('http')
const { Server } = require('socket.io');
const { cursorTo } = require("readline");
const router = express.Router();
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer");
require('dotenv').config();

const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;

const app = express();
const server = http.createServer(app)
const io = new Server(server, {
  cors:{
    origin: '*'
  }
});

const PORT = 5000;

// Configure Outlook SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // or 587 if using STARTTLS
  secure: true, // true for 465, false for 587
  auth: {
    user: "jmv1210@gmail.com",// your Gmail address
    pass: "rfyd idhf rkzk gpxw"      // Gmail App Password
  }
});
// ✅ Add this middleware to parse JSON request bodies
app.use(express.json());
app.use(cors())
// CREATE TABLE viewtimes (
//     id SERIAL PRIMARY KEY,
//     country TEXT NOT NULL,
//     ip TEXT NOT NULL,
//     city TEXT NOT NULL,
//     region TEXT NOT NULL,
//     timezone TEXT NOT NULL,
//     videoname TEXT DEFAULT NULL,
//     viewtime FLOAT DEFAULT 0,
//     updatedtime TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')
// );

// CREATE TABLE users (
//   id SERIAL PRIMARY KEY,
//   fullname TEXT NOT NULL,
//   email TEXT UNIQUE NOT NULL,
//   password TEXT NOT NULL,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// Login API
app.post("/api/login", async(req, res) => {

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required." });
  }
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const hashedPassword = result.rows[0].password
    //Compare provided password with stored hash
    const match = await bcrypt.compare(password, hashedPassword)
     if(match) {
       // Create JWT token
       const token = jwt.sign({ email }, secretKey, { expiresIn: "1h" });
       console.log("token", token)
       res.json({ success: match, token });
    }
  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({ error: "Database error" });
  }
})
// Verify token route
app.post('/api/verify-token', (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.json({ valid: false });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.json({ valid: false });
    res.json({ valid: true, user });
  });
});
// Register API
app.post("/api/register", async (req, res) => {
  console.log('data', req.body)
  const { fullname, email, password } = req.body;
  //Generate a salt + hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds)

  if (!fullname || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  try {
    // You should hash the password before storing (for demo, plain text)
    const result = await pool.query(
      "INSERT INTO users (fullname, email, password) VALUES ($1, $2, $3) RETURNING id",
      [fullname, email, hashedPassword]
    );
    res.json({ success: true, userId: result.rows[0].id });
  } catch (err) {
    console.error("❌ Error registering user:", err);
    res.status(500).json({ error: "Database error" });
  }
});
// Get All Data API
app.get("/api/getAllData", async (req, res) => {
  console.log('Get All Data here')
    try {
      const result = await pool.query("SELECT * FROM viewtimes");
      res.json(result.rows); // send JSON back to client
    } catch (err) {
      console.error("❌ Database error:", err);
      res.status(500).json({ error: "Database error" });
    }
});
// Inside socket connection
io.on('connection', async (socket) => {
  // Client connected status
  console.log('Client connected:', socket.id);
  let  videoUrl_n,ip_n, country_n, region_n, city_n, timezone_n;

  socket.on('getUserInfo', async(data) => {
      // Getting client_id and Calling update viewtime
     const { videoUrl } = data;

    const { ip, country, region, city, timezone } = data.clientInfo;

    videoUrl_n = videoUrl

    ip_n = ip;country_n = country;region_n = region; city_n = city; timezone_n = timezone;

    if(!ip || !country || !region || !city || !timezone) 
      console.log("clientInfoError");
    try {
      const result = await pool.query(
        `
        INSERT INTO viewtimes (ip, country, region, city, timezone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        `,
        [ip, country, region, city, timezone]
      );

      const currentId = result.rows[0].id
      socket.emit('addClientId', currentId)
    } catch (err) {
      console.error("❌ Error inserting to DB:", err);
      res.status(500).json({ error: "Database error" });
    }
  })

  socket.on('emailNotification', async() => {
    const Eflag = videoUrl_n?.includes('English')

    console.log('Eflag', Eflag, 'videoUrl', videoUrl_n)
    
    const videoName = Eflag ? 'English' : 'Viet'

    await transporter.sendMail({
      from: "jmv1210@gmail.com",
      to: "JosephValanzuolo@gmail.com",
      subject: "Video",
      text: `A user from ${city_n}, ${region_n}, ${country_n} is currently watching ${videoName} video.`
    });
  })

  socket.on('viewTimeUpdateFromClient', async (data) => {
    console.log('viewTimeUpdateFromClient here');
    const { viewTime, videoName, userId } = data;

    try {
      // Insert or update the view time in DB
        await pool.query(
          `
            UPDATE viewtimes
            set videoname = $1,
              viewtime = $2,
              updatedtime = CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York'
            WHERE id=$3
          `,
         [ videoName, viewTime , userId]
       );

    } catch (err) {
      console.error('DB error while saving view time:', err);
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
