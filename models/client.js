const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    cno: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    psid: String,
    stoken: String,
    name: String,
    cellphone: String,
    plan: String,
    insDate: String,
    due: String,
    fbName: String,
    gcashCode: String,
    thisMonthDue: String,

    billings: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);


//The Idea is like this 

// {
//   cno: "CNO1903",
//   name: "Juan Dela Cruz",
//   cellphone: "09123456789",
//   plan: "800",
//   insDate: "01/01/2025",
//   fbName: "Juan FB",
//   gcashCode: "...",
//   thisMonthDue: "...",
//   billings: {
//     "2025_January": {
//       amountPaid: "800",
//       datePaid: "01/05/2025"
//     },
//     "2025_February": {
//       amountPaid: "",
//       datePaid: ""
//     }
//   }
// }