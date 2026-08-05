require("dotenv").config();
const express = require("express"); // the backend 
const cors = require("cors"); // Cors allows the backend and frontend to talk
const app = express();

const dbConnect = require("./middleware/dbConnect"); //Middleware for Db Connection

//import the service route via the folder 
const login = require("./services/login");
const searchClient = require("./services/searchClient")
const admin = require("./services/admin")
// Note we don't sync client that's for sync function

//import the Syncfunction routes via the folder
const {
  router: automaticSync,
  startAutomaticSync,
} = require("./syncFunction/AutomaticSync");
// With Automatic Sync 


const manualSync = require("./syncFunction/ManualSync");


//Cors Protections
const allowedOrigins = [
  "https://airfiberphilippines.com",
  "https://www.airfiberphilippines.com",
];
//Protected via the CORS 
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

//Note: Ai Fixed not sure on what this do 
app.set("trust proxy", 1);
//=============================================


//MongoDB connection ======================
// Old Mongoose Connection 
// mongoose
//   .connect(process.env.MONGODB_URI, {
//     serverSelectionTimeoutMS: 10000,
//   })
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((error) => {
//     console.log("MongoDB connection error:", error.message);
//   });
//=========================================

// New conncetion 
// const PORT = process.env.PORT || 5000;
// app.use(express.json());

// async function startServer() {
//   try {
//     await dbConnect();

//     startAutomaticSync();

//     app.listen(PORT, () => {
//       console.log(`Running on ${PORT}`);
//     });
//   } catch (error) {
//     console.error("Server could not start:", error.message);
//     process.exit(1);
//   }
// }

// TEST 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Running on ${PORT}`);
});

// Check outbound IP once during startup
fetch("https://api.ipify.org?format=json")
  .then((response) => response.json())
  .then((data) => {
    console.log("Hostinger outbound IP:", data.ip);
  })
  .catch((error) => {
    console.error("Could not detect outbound IP:", error.message);
  });

// Connect to MongoDB after the server starts listening
dbConnect()
  .then(() => {
    console.log("MongoDB connected successfully");

    // Start sync only after MongoDB connects
    startAutomaticSync();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });



//tester
// app.get("/", (req, res) => {
//   res.send("SOA backend is running");
// });

// app.get("/db-test", (req, res) => {
//   res.json({
//     readyState: mongoose.connection.readyState,
//     status:
//       mongoose.connection.readyState === 1
//         ? "connected"
//         : "not connected",
//   });
// });

// app.get("/env-test", (req, res) => {
//   res.json({
//     mongodb: !!process.env.MONGODB_URI,
//     spreadsheet: !!process.env.SPREADSHEET_ID,
//     googleCredentialsBase64: !!process.env.GOOGLE_CREDENTIALS_BASE64,
//   });
// });



//Login route
app.use(login);

// Search Post Function For getting a single Client from MongoDB
app.use(searchClient);

//Automatic sync for button route
app.use(automaticSync);

//Manual sync for button route
app.use(manualSync);

//Admin route
app.use(admin); 



startServer();