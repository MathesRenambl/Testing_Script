import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { getAllUserAccounts } from './api.js';

var globalAmount = 0;
var phoneNumber;

var fromDate = new Date("2025-09-10T00:00:00Z");
var toDate = new Date("2025-09-10T23:59:59Z");
var storeNameMerchantId = []
const apiKey2 = process.env.API_KEY2;
dotenv.config();

const fixedData = {
    apiKey: "M2hZZytlZU1vL3h0aWR2TXVoOUFhdTV1RmNRaWVnaGYxZ0Vpb0hBVmFKbz",
    Payeraddr: "chiyan@ybl",
    PayerName: "Rahul Sharma",
};

const endpoint = `${process.env.YAHVIPAY_ADMIN_BACKEND}/temp/initiateTransaction`; 

// Helper to generate a random date between two dates
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

// Helper to generate random integer in range
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to generate dummy reference IDs
function generateMerchantRefId(prefix = "REF") {
    return `${prefix}${Math.floor(Math.random() * 1000000000)}`;
}

function generateRRN() {
    return `${Math.floor(Math.random() * 100000000000)}`;
}

function generateUpiTransID() {
    return `${Math.floor(Math.random() * 1000000000)}`;
}
// Function to split amount into random parts summing to total
function splitAmount(totalAmount) {
    const splits = [];
    let remaining = totalAmount;

    while (remaining > 0) {
        const next = Math.min(randomInt(500, 3000), remaining); // each split 500–3000
        splits.push(next);
        remaining -= next;
    }

    return splits;
}

function istToUtc(istDateTime) {
    // Example input:
    // "2025-09-12 22:15:30" (24h) OR "2025-09-12 10:15:30 PM" (12h)

    let [datePart, timePart, meridian] = istDateTime.trim().split(" ");
    const [year, month, day] = datePart.split("-").map(Number);
    let [hours, minutes, seconds] = timePart.split(":").map(Number);

    // Handle 12-hour format with AM/PM
    if (meridian) {
        meridian = meridian.toUpperCase();
        if (meridian === "PM" && hours < 12) hours += 12;
        if (meridian === "AM" && hours === 12) hours = 0;
    }

    // Construct UTC date (subtract IST offset 5h30m)
    const date = new Date(Date.UTC(year, month - 1, day, hours - 5, minutes - 30, seconds));

    return date.toISOString();
}

// Main function
async function generateAndSendTransactions(vpa, fromDate, toDate, amount) {

    // fromDate = startDate
    // toDate = endDate

    globalAmount = amount
    const amounts = splitAmount(globalAmount);
    const payloads = [];

    for (let amount of amounts) {
        const data = {
        KVBData: {
            ...fixedData,
            Amount: amount.toString(),
            PayeeAddr: vpa,
            MerchantRefID: generateMerchantRefId("REF"),
            TransDate: randomDate(fromDate, toDate),
            RRN: generateRRN(),
            UpiTransID: generateUpiTransID(),
        },
        };

        payloads.push(data);
    }

    console.log(payloads);
    console.log(`✅ Generated ${payloads.length} payloads.`);

    // Send them one by one
    for (let i = 0; i < payloads.length; i++) {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payloads[i]),
            });
            console.log(`✅ Sent payload ${i + 1}/${payloads.length}:`, response.status);
        } 
        catch (error) {
            console.error(`❌ Error sending payload ${i + 1}:`, error.message);
        }
    }
}

export async function createTransactions() {

    
    const nowUTC = new Date(); // ✅ current time in UTC

    const year = nowUTC.getUTCFullYear();
    const month = String(nowUTC.getUTCMonth() + 1).padStart(2, '0');
    const day = String(nowUTC.getUTCDate()).padStart(2, '0');
    // ✅ Use nowUTC as the startDate
    const startDate = nowUTC;

    // ✅ End of the same UTC day
    const endDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
    console.log(startDate, endDate)
    console.log("\n\n🔐 Starting Login Flow...");
        
    // Step 1: Get phone number from the user
    const { phoneNo } = await inquirer.prompt([
        {
            type: 'input',
            name: 'phoneNo',
            message: 'Please enter your phone number:',
            validate: (input) => {
                const phonePattern = /^\d{10}$/;
                if (phonePattern.test(input)) {
                    phoneNumber = input;
                    return true;
                }
                return 'Please enter a valid 10-digit phone number.';
            }
        }
    ]);

    const { amount } = await inquirer.prompt([
        {
            type: 'input',
            name: 'amount',
            message: 'Enter charge amount:',
            validate: (input) => {
                // Ensure input is a number and greater than 0
                if (isNaN(input) || input <= 100) {
                    return 'Please enter a valid positive number for the amount.';
                }
                globalAmount = input; // Store the valid amount
                return true;
            }
        }
    ]);

    const { fromDateTime, toDateTime } = await inquirer.prompt([
        {
            type: 'input',
            name: 'fromDateTime',
            message: 'Enter from date and time (YYYY-MM-DD HH:MM:SS AM/PM):',
            validate: (input) => {
                const dateTimeRegex = /^(?:\d{4}-\d{2}-\d{2}) (?:\d{1,2}:\d{2}:\d{2} (?:AM|PM))$/;
                return dateTimeRegex.test(input) ? true : 'Invalid format. Use YYYY-MM-DD HH:MM:SS AM/PM.';
            }
        },
        {
            type: 'input',
            name: 'toDateTime',
            message: 'Enter to date and time (YYYY-MM-DD HH:MM:SS AM/PM):',
            validate: (input) => {
                const dateTimeRegex = /^(?:\d{4}-\d{2}-\d{2}) (?:\d{1,2}:\d{2}:\d{2} (?:AM|PM))$/;
                return dateTimeRegex.test(input) ? true : 'Invalid format. Use YYYY-MM-DD HH:MM:SS AM/PM.';
            }
        }
    ]);

    // Convert input date to fromDate and toDate
    const fromDate = new Date(istToUtc(fromDateTime));
    const toDate = new Date(istToUtc(toDateTime));

    // Debug log
    console.log("📅 From Date:", fromDate);
    console.log("📅 To Date:", toDate);

    phoneNumber = phoneNo
    console.log(typeof phoneNumber)

    if(phoneNumber) {
        const Payload = {
            businessPhone : phoneNumber,
            apiKey : apiKey2
        }
        const phoneByMerchant = await getAllUserAccounts(Payload)
        if(phoneByMerchant.Success) {
            const id = phoneByMerchant.Success.map((item, index) => ({
                businessName : item.businessName,
                merchantId : item.merchantId,
                businessVPA : item.businessVPA
            }))
            storeNameMerchantId = id
            console.log(storeNameMerchantId)
            if(amount <= 100) {
                return console.log("The Total amount is not less then 100.");
            }
            for (const store of storeNameMerchantId) {
                console.log(store.businessVPA)
                
                await generateAndSendTransactions(store.businessVPA, fromDate, toDate, amount)
            }
        }
        else {
            console.log("Error : ", phoneByMerchant.Error)
        }
    }
}
createTransactions()