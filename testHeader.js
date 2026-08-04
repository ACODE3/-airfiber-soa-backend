const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const mongoose = require("mongoose");
require("dotenv").config();

const ClientDB = require("./models/client");
const app = express();

//This is the helper function
const {
  getSheetValues,
  buildHeaderMap,
  getCell,
  buildBillingMap,
} = require("./googleSheetsHelper");

//and what do these do ? 
app.use(cors()); // these allows us to use different ports to call from react to server js  
app.use(express.json()); //allows express to understand json
// These 

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.log("MongoDB connection error:", error.message));


// Search Post Function For getting a single Client from MongoDB
app.post("/api/search-client", async (req, res) => {
  try {
    const { cno } = req.body;

    if (!cno) {
      return res.status(400).json({
        message: "CNO is required",
      });
    }

    const cleanCno = cno.toUpperCase().trim();

    const foundClient = await ClientDB.findOne({
      cno: cleanCno,
    });

    if (!foundClient) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    res.json(foundClient);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});


//Test post for real sheet data
app.post("/api/test-upsert-client", async (req, res) => {
  try {
    const values = await getSheetValues("FS IMUS!A3:BN8");

    const yearRow = values[0];
    const headerRow = values[1];
    const clientRows = values.slice(2);

    const headers = buildHeaderMap(headerRow);
    const billingMap = buildBillingMap(yearRow, headerRow);

    const clients = clientRows.map((row) => {
      const billings = {};

      Object.entries(billingMap).forEach(([billingKey, indexes]) => {
        billings[billingKey] = {
          amountPaid: row[indexes.amountIndex] || "",
          datePaid: row[indexes.dateIndex] || "",
        };
      });

      return {
        cno: getCell(row, headers, "CLIENT CODE"),
        name: getCell(row, headers, "NAME"),
        psid: getCell(row, headers, "PSID"),
        cellphone: getCell(row, headers, "CELLPHONE"),
        plan: getCell(row, headers, "PLAN"),
        insDate: getCell(row, headers, "INS DATE"),
        fbName: getCell(row, headers, "FBNAME"),
        gcashCode: getCell(row, headers, "GCASH CODE"),
        thisMonthDue: getCell(row, headers, "THIS MONTH DUE"),
        billings,
      };
    });

    let savedCount = 0;
    let skippedCount = 0;

    for (const client of clients) {
      // Skip blank rows or rows without client code
      if (!client.cno || client.cno.trim() === "") {
        skippedCount++;
        continue;
      }

      // Clean CNO before saving
      client.cno = client.cno.toUpperCase().trim();

      await ClientDB.findOneAndUpdate(
        { cno: client.cno },
        client,
        {
          upsert: true,
          new: true,
        }
      );

      savedCount++;
    }

    res.json({
      message: "Clients synced successfully",
      totalRows: clients.length,
      savedCount,
      skippedCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to upsert clients",
      error: error.message,
    });
  }
});


app.listen(5000, () => console.log("Running on 5000"));