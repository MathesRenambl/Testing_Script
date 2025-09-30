// // import axios from "axios";
// // import Papa from "papaparse";
// // import fs from "fs";

// // // API URL
// // const API_URL = "http://192.168.1.38:65235/temp/initiateTransaction";

// // // Output CSV path
// // const OUTPUT_CSV_PATH = "./transaction_results.csv";

// // // Base payload
// // const basePayload = {
// //   KVBData: {
// //     apiKey: "M2hZZytlZU1vL3h0aWR2TXVoOUFhdTV1RmNRaWVnaGYxZ0Vpb0hBVmFKbz",
// //     Amount: "24000",
// //     PayeeAddr: "yahvipay.1758797731290@kvb",
// //     Payeraddr: "chiyan@ybl",
// //     PayerName: "Rahul Sharma",
// //     MerchantRefID: "REF123456789",
// //     RRN: "87845425454",
// //     UpiTransID: "546546554",
// //   },
// // };

// // /**
// //  * Generate ISO string for a specific IST date, hour, and minute.
// //  * @param {Date} baseDate - The base date object.
// //  * @param {number} hour - The hour of the day in IST (0-23).
// //  * @param {number} minute - The minute (0 or 30).
// //  * @returns {string} An ISO string with +05:30 offset.
// //  */
// // function getISTDateForHourAndMinute(baseDate, hour, minute) {
// //   const year = baseDate.getFullYear();
// //   const month = String(baseDate.getMonth() + 1).padStart(2, "0");
// //   const day = String(baseDate.getDate()).padStart(2, "0");

// //   const hourStr = String(hour).padStart(2, "0");
// //   const minuteStr = String(minute).padStart(2, "0");
// //   const secondStr = "00";

// //   return `${year}-${month}-${day}T${hourStr}:${minuteStr}:${secondStr}+05:30`;
// // }

// // /**
// //  * Save transaction results to CSV.
// //  * @param {Array} results - Array of transaction result objects.
// //  */
// // function saveResultsToCSV(results) {
// //   try {
// //     // Define CSV headers
// //     const csvData = Papa.unparse(results, {
// //       header: true,
// //       columns: ["transDate", "status", "response", "error"],
// //     });

// //     // Write to CSV file
// //     fs.writeFileSync(OUTPUT_CSV_PATH, csvData, "utf8");
// //     console.log(`✅ Transaction results saved to ${OUTPUT_CSV_PATH}`);
// //   } catch (error) {
// //     console.error(`❌ Error saving to CSV: ${error.message}`);
// //   }
// // }

// // /**
// //  * Run transactions every 30 minutes for 24 hours in IST and save results to CSV.
// //  */
// // async function runTransactions() {
// //   // Get "today" in IST
// //   const todayIST = new Date(
// //     new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
// //   );

// // //   const yesterdayIST = new Date(todayIST);
// // //   yesterdayIST.setDate(todayIST.getDate() - 1);
// //   // Array to store transaction results
// //   const transactionResults = [];

// //   // Loop through 24 hours, with 30-minute intervals (00:00, 00:30, ..., 23:30)
// //   for (let h = 0; h < 24; h++) {
// //     // for (let m of [0, 30]) 
// //     for(let m = 0; m < 60; m++) { // 0 and 59 minutes
// //       const transDate = getISTDateForHourAndMinute(todayIST, h, m);
// //       console.log(`📅 Processing transaction for ${transDate}`);

// //       const payload = {
// //         ...basePayload,
// //         KVBData: {
// //           ...basePayload.KVBData,
// //           TransDate: transDate,
// //         },
// //       };

// //       try {
// //         const res = await axios.post(API_URL, payload);
// //         console.log(`✅ ${transDate} API success`, res.data);

// //         // Store success result
// //         transactionResults.push({
// //           transDate,
// //           status: "Success",
// //           response: JSON.stringify(res.data),
// //           error: "",
// //         });
// //       } catch (err) {
// //         console.error(`❌ ${transDate} API failed:`, err.message);

// //         // Store error result
// //         transactionResults.push({
// //           transDate,
// //           status: "Failed",
// //           response: "",
// //           error: err.message,
// //         });
// //       }
// //     }
// //   }

// //   // Save results to CSV
// //   saveResultsToCSV(transactionResults);

// //   // Summary
// //   const successful = transactionResults.filter((r) => r.status === "Success").length;
// //   const failed = transactionResults.filter((r) => r.status === "Failed").length;
// //   console.log("\n" + "=".repeat(60));
// //   console.log(`🎉 Transaction Processing Complete`);
// //   console.log(`📊 Summary:`);
// //   console.log(`   Total transactions: ${transactionResults.length}`);
// //   console.log(`   ✅ Successful: ${successful}`);
// //   console.log(`   ❌ Failed: ${failed}`);
// //   console.log(`   📁 Results saved to: ${OUTPUT_CSV_PATH}`);
// // }

// // // Run transactions for every 30 minutes over 24 hours
// // runTransactions();


// import axios from "axios";
// import Papa from "papaparse";
// import fs from "fs";

// // API URL and paths
// const API_URL = "http://192.168.1.38:65235/temp/initiateTransaction";
// const CREATED_MERCHANTS_CSV = "./created_merchants.csv";
// const OUTPUT_CSV_PATH = "./transaction_results.csv";

// // Base payload data (except VPA and date)
// const basePayload = {
//   KVBData: {
//     apiKey: "M2hZZytlZU1vL3h0aWR2TXVoOUFhdTV1RmNRaWVnaGYxZ0Vpb0hBVmFKbz", // use your real API key
//     Amount: "200",
//     Payeraddr: "chiyan@ybl",
//     PayerName: "Rahul Sharma",
//     MerchantRefID: "REF123456789",
//     RRN: "87845425454",
//     UpiTransID: "546546554",
//   },
// };

// /**
//  * Parse created_merchants.csv and return list of VPAs
//  */
// function getVPAsFromCSV() {
//   try {
//     const csvData = fs.readFileSync(CREATED_MERCHANTS_CSV, "utf8");
//     const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

//     const vpas = parsed.data
//       .map(row => row.VPA?.trim())
//       .filter(vpa => vpa && vpa.includes("@kvb")); // Ensure valid VPA format

//     console.log(`📥 Found ${vpas.length} VPAs in CSV`);
//     return vpas;
//   } catch (error) {
//     console.error("❌ Failed to read created_merchants.csv:", error.message);
//     process.exit(1);
//   }
// }

// /**
//  * Generate ISO string for a specific IST hour and minute.
//  */
// function getISTDateForHourAndMinute(baseDate, hour, minute) {
//   const year = baseDate.getFullYear();
//   const month = String(baseDate.getMonth() + 1).padStart(2, "0");
//   const day = String(baseDate.getDate()).padStart(2, "0");
//   const hourStr = String(hour).padStart(2, "0");
//   const minuteStr = String(minute).padStart(2, "0");
//   return `${year}-${month}-${day}T${hourStr}:${minuteStr}:00+05:30`;
// }

// /**
//  * Save transaction results to a CSV file
//  */
// function saveResultsToCSV(results) {
//   try {
//     const csvData = Papa.unparse(results, {
//       header: true,
//       columns: ["vpa", "transDate", "status", "response", "error"],
//     });

//     fs.writeFileSync(OUTPUT_CSV_PATH, csvData, "utf8");
//     console.log(`✅ Transaction results saved to ${OUTPUT_CSV_PATH}`);
//   } catch (error) {
//     console.error(`❌ Error saving CSV: ${error.message}`);
//   }
// }

// /**
//  * Run transactions for each VPA at 30-minute intervals for a day
//  */
// async function runTransactions() {
//   const vpas = getVPAsFromCSV();
//   const transactionResults = [];
//   let transactionCount = 0;
//   const MAX_TRANSACTIONS = 5;

//   // Get today's date in IST
//   const todayIST = new Date(
//     new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
//   );

//   for (const vpa of vpas) {
//     console.log(`\n🔁 Starting transactions for: ${vpa}`);

//     for (let hour = 0; hour < 24; hour++) {
//       const transDate = getISTDateForHourAndMinute(todayIST, hour, 0);

//       const payload = {
//         ...basePayload,
//         KVBData: {
//           ...basePayload.KVBData,
//           PayeeAddr: vpa,
//           TransDate: transDate,
//         },
//       };

//       try {
//         const res = await axios.post(API_URL, payload);
//         console.log(`✅ ${transDate} | ${vpa} | Success`);

//         transactionResults.push({
//           vpa,
//           transDate,
//           status: "Success",
//           response: JSON.stringify(res.data),
//           error: "",
//         });
//       } catch (err) {
//         console.error(`❌ ${transDate} | ${vpa} | Error: ${err.message}`);
//         transactionResults.push({
//           vpa,
//           transDate,
//           status: "Failed",
//           response: "",
//           error: err.message,
//         });
//       }

//       transactionCount++;
//       if (transactionCount >= MAX_TRANSACTIONS) {
//         console.log(`🛑 Reached maximum of ${MAX_TRANSACTIONS} transactions.`);
//         saveResultsToCSV(transactionResults);
//         return;
//       }

//       await new Promise(resolve => setTimeout(resolve, 100)); // Delay
//     }

//     console.log(`🛑 Finished transactions for: ${vpa}`);
//   }

//   // Save all results to CSV
//   saveResultsToCSV(transactionResults);

//   // Summary
//   const successCount = transactionResults.filter(r => r.status === "Success").length;
//   const failedCount = transactionResults.length - successCount;

//   console.log("\n📊 Summary:");
//   console.log(`   Total VPAs processed: ${vpas.length}`);
//   console.log(`   Total transactions: ${transactionResults.length}`);
//   console.log(`   ✅ Success: ${successCount}`);
//   console.log(`   ❌ Failed: ${failedCount}`);
//   console.log(`   📁 Saved to: ${OUTPUT_CSV_PATH}`);
// }
// runTransactions()


// import axios from "axios";
// import Papa from "papaparse";
// import fs from "fs";

// // === CONFIG ===
// const API_URL = "http://192.168.1.38:65235/temp/initiateTransaction";
// const OUTPUT_CSV_PATH = "./transaction_results.csv";
// const VPA = "yahvipay.1758971743667@kvb";

// // === Base Payload ===
// const payload = {
//   KVBData: {
//     apiKey: "M2hZZytlZU1vL3h0aWR2TXVoOUFhdTV1RmNRaWVnaGYxZ0Vpb0hBVmFKbz",
//     Amount: "1000",
//     Payeraddr: "chiyan@ybl",
//     PayerName: "Rahul Sharma",
//     MerchantRefID: "REF123456789",
//     RRN: "87845425454",
//     UpiTransID: "546546554",
//     PayeeAddr: VPA,
//     TransDate: new Date().toISOString(), // Current timestamp in ISO format
//   },
// };

// // === Save Result to CSV ===
// function saveToCSV(data) {
//   const csv = Papa.unparse(data, {
//     header: true,
//     columns: ["vpa", "transDate", "status", "response", "error"],
//   });
//   fs.writeFileSync(OUTPUT_CSV_PATH, csv, "utf8");
//   console.log(`✅ Result saved to ${OUTPUT_CSV_PATH}`);
// }

// // === Run the transaction ===
// async function runOneTransaction() {
//   console.log(`\n🚀 Sending transaction to: ${VPA}`);
//   try {
//     const res = await axios.post(API_URL, payload);
//     console.log("✅ Transaction success:", res.data);

//     const result = [
//       {
//         vpa: VPA,
//         transDate: payload.KVBData.TransDate,
//         status: "Success",
//         response: JSON.stringify(res.data),
//         error: "",
//       },
//     ];

//     saveToCSV(result);
//   } catch (err) {
//     console.error("❌ Transaction failed:", err.message);

//     const result = [
//       {
//         vpa: VPA,
//         transDate: payload.KVBData.TransDate,
//         status: "Failed",
//         response: "",
//         error: err.message,
//       },
//     ];

//     saveToCSV(result);
//   }
// }

// runOneTransaction();



// import axios from "axios";
// import Papa from "papaparse";
// import fs from "fs";

// // === CONFIG ===
// const API_URL = "http://192.168.1.38:65235/temp/initiateTransaction";
// const OUTPUT_CSV_PATH = "./transaction_results.csv";
// const VPA = "yahvipay.1758971743667@kvb";

// // === Date Range ===
// const startDate = "2025-08-01"; // YYYY-MM-DD
// const endDate = "2025-08-30";   // YYYY-MM-DD

// // === Base Payload (will modify TransDate per transaction) ===
// const basePayload = {
//   KVBData: {
//     apiKey: "M2hZZytlZU1vL3h0aWR2TXVoOUFhdTV1RmNRaWVnaGYxZ0Vpb0hBVmFKbz",
//     Amount: "1000",
//     Payeraddr: "chiyan@ybl",
//     PayerName: "Rahul Sharma",
//     MerchantRefID: "REF123456789",
//     RRN: "87845425454",
//     UpiTransID: "546546554",
//     PayeeAddr: VPA,
//     TransDate: "", // Will be set dynamically
//   },
// };

// // === Save Result to CSV ===
// function saveToCSV(data) {
//   const csv = Papa.unparse(data, {
//     header: true,
//     columns: ["vpa", "transDate", "status", "response", "error"],
//   });
//   fs.writeFileSync(OUTPUT_CSV_PATH, csv, "utf8");
//   console.log(`✅ Result saved to ${OUTPUT_CSV_PATH}`);
// }

// // === Get All Dates in Range ===
// function getDateRange(start, end) {
//   const dates = [];
//   const current = new Date(start);
//   const final = new Date(end);

//   while (current <= final) {
//     dates.push(new Date(current));
//     current.setDate(current.getDate() + 1);
//   }

//   return dates;
// }

// // === Run transactions for each date ===
// async function runTransactionsInDateRange() {
//   const results = [];
//   const dateList = getDateRange(startDate, endDate);

//   for (const date of dateList) {
//     const isoDate = new Date(date).toISOString();
//     console.log(`\n🚀 Sending transaction for date: ${isoDate}`);

//     const payload = JSON.parse(JSON.stringify(basePayload)); // Deep clone
//     payload.KVBData.TransDate = isoDate;

//     try {
//       const res = await axios.post(API_URL, payload);
//       console.log("✅ Transaction success:", res.data);

//       results.push({
//         vpa: VPA,
//         transDate: isoDate,
//         status: "Success",
//         response: JSON.stringify(res.data),
//         error: "",
//       });
//     } catch (err) {
//       console.error("❌ Transaction failed:", err.message);

//       results.push({
//         vpa: VPA,
//         transDate: isoDate,
//         status: "Failed",
//         response: "",
//         error: err.message,
//       });
//     }
//   }

//   // Save all results to CSV
//   saveToCSV(results);
// }

// runTransactionsInDateRange();


import axios from "axios";
import Papa from "papaparse";
import fs from "fs";

// === CONFIG ===
const API_URL = "http://192.168.1.38:65235/temp/initiateTransaction";
const OUTPUT_CSV_PATH = "./transaction_results.csv";
const VPA = "yahvipay.1759126224625@kvb";
const API_KEY = "M2hZZytlZU1vL3h0aWR2TXVoOUFhdTV1RmNRaWVnaGYxZ0Vpb0hBVmFKbz";

// === Date Range ===
const startDate = "2025-09-28"; // YYYY-MM-DD
const endDate = "2025-09-28";   // YYYY-MM-DD

// === Transaction Frequency ===
// Option 1: Number of transactions per day
const transactionsPerDay = 24; // Set to 24 for one per hour

// === Generate a unique ID for MerchantRefID, RRN, UpiTransID
function generateID(prefix) {
  return prefix + Math.floor(Math.random() * 1e12);
}

// === Save Result to CSV ===
function saveToCSV(data) {
  const csv = Papa.unparse(data, {
    header: true,
    columns: ["vpa", "transDate", "status", "response", "error"],
  });
  fs.writeFileSync(OUTPUT_CSV_PATH, csv, "utf8");
  console.log(`✅ Result saved to ${OUTPUT_CSV_PATH}`);
}

// === Get All Dates in Range ===
function getDateRange(start, end) {
  const dates = [];
  const current = new Date(start);
  const final = new Date(end);

  while (current <= final) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}


function formatDateLocalISO(date) {
  return date.getFullYear()
    + "-" + String(date.getMonth() + 1).padStart(2, '0')
    + "-" + String(date.getDate()).padStart(2, '0')
    + "T" + String(date.getHours()).padStart(2, '0')
    + ":" + String(date.getMinutes()).padStart(2, '0')
    + ":" + String(date.getSeconds()).padStart(2, '0');
}


// === Generate timestamps for each transaction in a day ===
function generateTimestampsForDay(date, count) {
  const timestamps = [];
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const intervalMs = Math.floor(24 * 60 * 60 * 1000 / count);

  for (let i = 0; i < count; i++) {
    const time = new Date(start.getTime() + i * intervalMs);
    timestamps.push(formatDateLocalISO(time));

  }

  return timestamps;
}

// === Run transactions === //
async function runTransactionsInDateRange() {
  const results = [];
  const dateList = getDateRange(startDate, endDate);

  for (const date of dateList) {
    const timestamps = generateTimestampsForDay(date, transactionsPerDay);

    for (const transDate of timestamps) {
      const payload = {
        KVBData: {
          apiKey: API_KEY,
          Amount: "100",
          Payeraddr: "chiyan@ybl",
          PayerName: "Rahul Sharma",
          MerchantRefID: generateID("REF"),
          RRN: generateID("RRN"),
          UpiTransID: generateID("TXN"),
          PayeeAddr: VPA,
          TransDate: transDate,
        },
      };

      console.log(`🚀 Sending transaction at ${transDate}`);

      try {
        const res = await axios.post(API_URL, payload);
        console.log("✅ Transaction success:", res.data);

        results.push({
          vpa: VPA,
          transDate: transDate,
          status: "Success",
          response: JSON.stringify(res.data),
          error: "",
        });
      } catch (err) {
        console.error("❌ Transaction failed:", err.message);

        results.push({
          vpa: VPA,
          transDate: transDate,
          status: "Failed",
          response: "",
          error: err.message,
        });
      }
    }
  }

  saveToCSV(results);
}

runTransactionsInDateRange();

















// import axios from "axios";
// import Papa from "papaparse";
// import fs from "fs";

// const API_URL = "http://192.168.1.38:65235/temp/initiateTransaction";
// const CREATED_MERCHANTS_CSV = "./created_merchants.csv";
// const OUTPUT_CSV_PATH = "./transaction_results.csv";

// // Number of transactions per VPA
// const NUM_TRANSACTIONS_PER_VPA = 3;

// // Read VPAs from CSV filtered by @kvb
// function getVPAsFromCSV() {
//   try {
//     const csvData = fs.readFileSync(CREATED_MERCHANTS_CSV, "utf8");
//     const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
//     const vpas = parsed.data
//       .map(row => row.VPA?.trim())
//       .filter(vpa => vpa && vpa.includes("@kvb"));

//     if (vpas.length === 0) throw new Error("No valid VPAs found.");
//     console.log(`📥 Found ${vpas.length} VPAs.`);
//     return vpas;
//   } catch (error) {
//     console.error("❌ Error reading VPAs:", error.message);
//     process.exit(1);
//   }
// }

// // Save results to CSV
// function saveToCSV(data) {
//   const csv = Papa.unparse(data, {
//     header: true,
//     columns: ["vpa", "transDate", "status", "response", "error"],
//   });
//   fs.writeFileSync(OUTPUT_CSV_PATH, csv, "utf8");
//   console.log(`✅ Results saved to ${OUTPUT_CSV_PATH}`);
// }

// async function runTransactions() {
//   const vpas = getVPAsFromCSV();
//   const results = [];

//   for (const vpa of vpas) {
//     console.log(`\n🔁 Starting transactions for VPA: ${vpa}`);

//     for (let i = 0; i < NUM_TRANSACTIONS_PER_VPA; i++) {
//       const uniqueSuffix = Date.now().toString().slice(-6) + i;
//       const payload = {
//         KVBData: {
//           apiKey: "M2hZZytlZU1vL3h0aWR2TXVoOUFhdTV1RmNRaWVnaGYxZ0Vpb0hBVmFKbz",
//           Amount: "1000",
//           Payeraddr: "chiyan@ybl",
//           PayerName: "Rahul Sharma",
//           MerchantRefID: "REF" + uniqueSuffix,
//           RRN: "RRN" + uniqueSuffix,
//           UpiTransID: "TXN" + uniqueSuffix,
//           PayeeAddr: vpa,
//           TransDate: new Date().toISOString(),
//         },
//       };

//       console.log(`🚀 Transaction ${i + 1} for ${vpa}`);

//       try {
//         const res = await axios.post(API_URL, payload);
//         console.log("✅ Success", res.data);

//         results.push({
//           vpa,
//           transDate: payload.KVBData.TransDate,
//           status: "Success",
//           response: JSON.stringify(res.data),
//           error: "",
//         });
//       } catch (err) {
//         console.error("❌ Failed:", err.message);

//         results.push({
//           vpa,
//           transDate: payload.KVBData.TransDate,
//           status: "Failed",
//           response: "",
//           error: err.message,
//         });
//       }

//       await new Promise(r => setTimeout(r, 100)); // small delay
//     }

//     console.log(`✅ Finished transactions for ${vpa}`);
//   }

//   saveToCSV(results);
// }

// runTransactions(); 


// import axios from "axios";
// import Papa from "papaparse";
// import fs from "fs";

// const API_URL = "http://192.168.1.38:65235/temp/initiateTransaction";
// const CREATED_MERCHANTS_CSV = "./created_merchants.csv";
// const OUTPUT_CSV_PATH = "./transaction_results.csv";

// const NUM_TRANSACTIONS_PER_VPA = 1;
// const TRANSACTION_AMOUNT = "1000";  // Set your amount here as string

// function getVPAsFromCSV() {
//   try {
//     const csvData = fs.readFileSync(CREATED_MERCHANTS_CSV, "utf8");
//     const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
//     const vpas = parsed.data
//       .map(row => row.VPA?.trim())
//       .filter(vpa => vpa && vpa.includes("@kvb"));

//     if (vpas.length === 0) throw new Error("No valid VPAs found.");
//     console.log(`📥 Found ${vpas.length} VPAs.`);
//     return vpas;
//   } catch (error) {
//     console.error("❌ Error reading VPAs:", error.message);
//     process.exit(1);
//   }
// }

// function saveToCSV(data) {
//   const csv = Papa.unparse(data, {
//     header: true,
//     columns: ["vpa", "transDate", "amount", "status", "response", "error"],
//   });
//   fs.writeFileSync(OUTPUT_CSV_PATH, csv, "utf8");
//   console.log(`✅ Results saved to ${OUTPUT_CSV_PATH}`);
// }

// async function runTransactions() {
//   const vpas = getVPAsFromCSV();
//   const results = [];

//   for (const vpa of vpas) {
//     console.log(`\n🔁 Starting transactions for VPA: ${vpa}`);

//     for (let i = 0; i < NUM_TRANSACTIONS_PER_VPA; i++) {
//       const uniqueSuffix = Date.now().toString().slice(-6) + i;
//       const payload = {
//         KVBData: {
//           apiKey: "M2hZZytlZU1vL3h0aWR2TXVoOUFhdTV1RmNRaWVnaGYxZ0Vpb0hBVmFKbz",
//           Amount: TRANSACTION_AMOUNT,
//           Payeraddr: "chiyan@ybl",
//           PayerName: "Rahul Sharma",
//           MerchantRefID: "REF" + uniqueSuffix,
//           RRN: "RRN" + uniqueSuffix,
//           UpiTransID: "TXN" + uniqueSuffix,
//           PayeeAddr: vpa,
//           TransDate: new Date().toISOString(),
//         },
//       };

//       console.log(`🚀 Transaction ${i + 1} for ${vpa}`);

//       try {
//         const res = await axios.post(API_URL, payload);
//         console.log("✅ Success", res.data);

//         results.push({
//           vpa,
//           transDate: payload.KVBData.TransDate,
//           amount: TRANSACTION_AMOUNT,
//           status: "Success",
//           response: JSON.stringify(res.data),
//           error: "",
//         });
//       } catch (err) {
//         console.error("❌ Failed:", err.message);

//         results.push({
//           vpa,
//           transDate: payload.KVBData.TransDate,
//           amount: TRANSACTION_AMOUNT,
//           status: "Failed",
//           response: "",
//           error: err.message,
//         });
//       }

//       await new Promise(r => setTimeout(r, 100)); // small delay
//     }

//     console.log(`✅ Finished transactions for ${vpa}`);
//   }

//   saveToCSV(results);

//   // Calculate and print total amount transacted successfully
//   const totalAmount = results
//     .filter(r => r.status === "Success")
//     .reduce((sum, r) => sum + Number(r.amount), 0);

//   console.log(`\n💰 Total amount transacted successfully: ₹${totalAmount}`);
// }

// runTransactions();

