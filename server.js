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
const soaDashboard = require("./syncFunction/SoaDashboard");
const networkDiagnostics = require("./services/networkDiagnostics");


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
//SOA dashboard: status, sync history, client preview
app.use(soaDashboard);
//TEMPORARY: outbound IP check, see services/networkDiagnostics.js
app.use(networkDiagnostics);

const PORT = process.env.PORT || 5000;

async function startServer() {
  app.listen(PORT, () => {
    console.log(`Running on ${PORT}`);
  });

  try {
    await dbConnect();
    console.log("MongoDB connected successfully");

    startAutomaticSync();
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
}

startServer();

