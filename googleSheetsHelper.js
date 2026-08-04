// googleSheetsHelper.js
const { google } = require("googleapis");
require("dotenv").config();

const spreadsheetId = process.env.SPREADSHEET_ID;

function getGoogleCredentials() {
  const base64 = process.env.GOOGLE_CREDENTIALS_BASE64;

  if (!base64) {
    throw new Error("GOOGLE_CREDENTIALS_BASE64 is missing");
  }

  const jsonString = Buffer.from(base64, "base64").toString("utf8");

  return JSON.parse(jsonString);
}


async function getGoogleSheetsClient() {
  const credentials = getGoogleCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const client = await auth.getClient();

  const googleSheets = google.sheets({
    version: "v4",
    auth: client,
  });

  return googleSheets;
}

// Gets the range from Google Sheets and returns it as an array
async function getSheetValues(range) {
  const googleSheets = await getGoogleSheetsClient();

  const response = await googleSheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values || [];
}

// Turns the header row into an object that maps header name → column index
function buildHeaderMap(headerRow) {
  const headers = {};

  headerRow.forEach((header, index) => {
    if (!header) return;
    headers[header.toLowerCase().trim()] = index;
  });

  return headers;
}

// Shortcut for getting a cell value by header name
function getCell(row, headerMap, headerName) {
  const key = headerName.toLowerCase().trim();
  const index = headerMap[key];

  if (index === undefined) {
    return "";
  }

  return row[index] || "";
}

// Billing helper function mapping month + year columns
function buildBillingMap(yearRow, headerRow) {
  const billingMap = {};

  const monthMap = {
    JAN: "01",
    FEB: "02",
    MAR: "03",
    APR: "04",
    MAY: "05",
    JUN: "06",
    JUL: "07",
    AUG: "08",
    SEP: "09",
    OCT: "10",
    NOV: "11",
    DEC: "12",
  };

  headerRow.forEach((header, index) => {
    if (!header) return;

    const cleanHeader = header.toUpperCase().trim();

    const isAmountColumn = cleanHeader.includes("AMT PAID");
    const isDateColumn = cleanHeader.includes("DATE PAID");

    if (!isAmountColumn && !isDateColumn) return;

    const monthText = cleanHeader.split(" ")[0]; // OCT AMT PAID -> OCT
    const monthNum = monthMap[monthText];

    if (!monthNum) return;

    const year = yearRow[index];

    if (!year) return;

    const billingKey = `${year}-${monthNum}`;

    if (!billingMap[billingKey]) {
      billingMap[billingKey] = {};
    }

    if (isAmountColumn) {
      billingMap[billingKey].amountIndex = index;
    }

    if (isDateColumn) {
      billingMap[billingKey].dateIndex = index;
    }
  });

  return billingMap;
}

module.exports = {
  getGoogleSheetsClient,
  getSheetValues,
  buildHeaderMap,
  getCell,
  buildBillingMap,
};