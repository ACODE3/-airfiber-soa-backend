const express = require("express");
const router = express.Router();
const ClientDB = require("../models/Client");


const {
  authorizeRoles,
  verifyToken,
  loginLimiter,
  clientLimiter,
} = require("../middleware/Middleware");


// Search Post Function For getting a single Client from MongoDB
router.post("/api/search-client", clientLimiter, async (req, res) => {
  try {
    const { cno, stoken } = req.body;

    if (cno.length > 50 || stoken.length > 200) {
      return res.status(400).json({
        message: "Invalid CNO or token",
      });
    }

    //Note: Ai Fixed Needs to be checked 
    if (typeof cno !== "string" || typeof stoken !== "string" || !cno.trim() ||!stoken.trim()) {
      return res.status(400).json({
        message: "Valid CNO and token are required",
      });
    }

    const cleanCno = cno.toUpperCase().trim();
    const cleanStoken = stoken.trim();

    const foundClient = await ClientDB.findOne({
      cno: cleanCno,
      stoken: cleanStoken,
    });

    if (!foundClient) {
      return res.status(404).json({
        message: "Invalid CNO or token",
      });
    }

    //Note: AI fixed Needs checking 
    return res.status(200).json({
        cno: foundClient.cno,
        name: foundClient.name,
        cellphone: foundClient.cellphone,
        gcashCode: foundClient.gcashCode,
        fbName: foundClient.fbName,
        plan: foundClient.plan,
        insDate: foundClient.insDate,
        thisMonthDue: foundClient.thisMonthDue,
        billings: foundClient.billings,
      });

  } catch (error) {
    console.error("Client search failed:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
});


module.exports = router;