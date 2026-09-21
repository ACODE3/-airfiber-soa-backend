const {
  getSheetValues,
  buildHeaderMap,
  getCell,
  buildBillingMap,
} = require("../googleSheetsHelper");
const ClientDB = require("../models/client");

async function syncClients() {
  console.log("Starting client synchronization...");

  // 1. Get values from Google Sheets
  const values = await getSheetValues("FS IMUS!A3:DI500");

  if (!Array.isArray(values) || values.length < 2) {
    throw new Error("Google Sheet header rows are missing");
  }

  const yearRow = values[0];
  const headerRow = values[1];
  const clientRows = values.slice(2);

  const headers = buildHeaderMap(headerRow);
  const billingMap = buildBillingMap(yearRow, headerRow);

  const clients = clientRows.map((row) => {
    const billings = {};

    Object.entries(billingMap).forEach(([billingKey, indexes]) => {
      billings[billingKey] = {
        amountPaid: row[indexes.amountIndex] ?? "",
        datePaid: row[indexes.dateIndex] ?? "",
      };
    });

    return {
      cno: getCell(row, headers, "CLIENT CODE"),
      stoken: getCell(row, headers, "STOKEN"),
      name: getCell(row, headers, "NAME"),
      psid: getCell(row, headers, "PSID"),
      cellphone: getCell(row, headers, "CELLPHONE"),
      plan: getCell(row, headers, "PLAN"),
      insDate: getCell(row, headers, "INS DATE"),
      due: getCell(row, headers, "DUE"),
      fbName: getCell(row, headers, "FBNAME"),
      gcashCode: getCell(row, headers, "GCASH CODE"),
      thisMonthDue: getCell(row, headers, "THIS MONTH DUE"),
      billings,
    };
  });

  let savedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const sampleErrors = [];
  const syncedCnos = [];

  for (const client of clients) {
    // Skip blank rows or rows without client code
    if (!client.cno || String(client.cno).trim() === "") {
      skippedCount++;
      continue;
    }

    // Clean & safely convert values to string
    client.cno = String(client.cno).toUpperCase().trim();
    client.stoken = String(client.stoken || "").trim();
    client.due = String(client.due || "").trim();

    try {
      await ClientDB.findOneAndUpdate(
        { cno: client.cno },
        { $set: client },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      savedCount++;
      syncedCnos.push(client.cno);
    } catch (error) {
      errorCount++;
      if (sampleErrors.length < 5) {
        sampleErrors.push(`${client.cno}: ${error.message}`);
      }
    }
  }

  const staleInDb = await ClientDB.countDocuments({
    cno: { $nin: syncedCnos },
  });

  console.log("Client synchronization completed.");

  return {
    message: "Clients synced successfully",
    totalRows: clients.length,
    saved: savedCount,
    skipped: skippedCount,
    errorCount,
    sampleErrors,
    staleInDb,
  };
}

module.exports = syncClients;