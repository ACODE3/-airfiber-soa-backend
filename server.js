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



app.use(express.json());


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

const PORT = process.env.PORT || 5000;

// Start server immediately
app.listen(PORT, () => {
  console.log(`Running on ${PORT}`);
});

// Check outbound IP
fetch("https://api.ipify.org?format=json")
  .then((response) => response.json())
  .then((data) => {
    console.log("Hostinger outbound IP:", data.ip);
  })
  .catch((error) => {
    console.error("Could not detect outbound IP:", error.message);
  });

// Connect to MongoDB
dbConnect()
  .then(() => {
    console.log("MongoDB connected successfully");
    startAutomaticSync();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });


