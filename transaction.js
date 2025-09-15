import dotenv from 'dotenv';
import Papa from 'papaparse';
import fs from 'fs';
import { getAllUserAccounts } from './api.js';

dotenv.config();

// CSV file paths
const INPUT_CSV_PATH = './input_config.csv';
const TRANSACTIONS_OUTPUT_PATH = './transaction_payloads.csv';

// Configuration
var storeNameMerchantId = [];
const apiKey2 = process.env.API_KEY2;
var phoneNumber = "";

// Store transaction payloads for CSV output
const transactionPayloads = [];

// Configuration object
let config = {
    merchants: []
};

// Fixed transaction data
const fixedData = {
    apiKey: "M2hZZytlZU1vL3h0aWR2TXVoOUFhdTV1RmNRaWVnaGYxZ0Vpb0hBVmFKbz",
    Payeraddr: "chiyan@ybl",
    PayerName: "Rahul Sharma",
};

const endpoint = `${process.env.YAHVIPAY_ADMIN_BACKEND}/temp/initiateTransaction`;

function printSection(title, data) {
    console.log(`\n========== 📌 ${title.toUpperCase()} ==========\n`);
    console.log(JSON.stringify(data, null, 2));
}

function printProgress(current, total, message) {
    const progress = `[${current}/${total}]`;
    const borderLine = "=".repeat(60);
    console.log(borderLine);
    console.log(`${progress} ${message}`);
    console.log(borderLine);
}

// Helper functions for transaction generation
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
        const next = Math.min(randomInt(100, 1000), remaining);
        splits.push(next);
        remaining -= next;
    }

    return splits;
}

// Function to read and parse input CSV file
async function readInputCSV(filePath = INPUT_CSV_PATH) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Input CSV file not found at path: ${filePath}`);
        }

        const csvData = fs.readFileSync(filePath, 'utf8');
        
        const parseResult = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            delimitersToGuess: [',', ';', '\t']
        });

        if (parseResult.errors.length > 0) {
            console.error('CSV parsing errors:', parseResult.errors);
        }

        const merchants = [];
        parseResult.data.forEach((row, index) => {
            // Clean and extract data from row
            const businessNumber = (row.businessNumber || row.phoneNumber || row.phone || '').toString().trim();
            const transactionAmount = parseFloat(row.transactionAmount || row.transAmount || 0);
            
            // Validate business number format (10 digits)
            if (businessNumber && /^\d{10}$/.test(businessNumber)) {
                merchants.push({
                    index: index + 1,
                    businessNumber,
                    transactionAmount: transactionAmount > 0 ? transactionAmount : 1000 // Default transaction amount
                });
            } else {
                console.warn(`⚠️  Row ${index + 1}: Invalid business number '${businessNumber}' - skipping`);
            }
        });

        config = { merchants };

        console.log('\n📊 Input CSV Configuration loaded for transactions:');
        console.log(`📱 Valid merchants: ${merchants.length}`);
        merchants.forEach(m => {
            console.log(`   ${m.businessNumber}: ₹${m.transactionAmount} transactions`);
        });

        return config;
    } catch (error) {
        console.error('❌ Error reading input CSV:', error.message);
        throw error;
    }
}

// Function to save transaction payloads to CSV
async function saveTransactionPayloadsToCSV() {
    try {
        // Check if file exists and read existing data
        let existingData = [];
        if (fs.existsSync(TRANSACTIONS_OUTPUT_PATH)) {
            const existingCsv = fs.readFileSync(TRANSACTIONS_OUTPUT_PATH, 'utf8');
            const parsed = Papa.parse(existingCsv, { header: true });
            existingData = parsed.data.filter(row => row.businessNumber && row.businessNumber.trim() !== '');
        }

        // Combine existing and new data
        const allData = [...existingData, ...transactionPayloads];

        // Convert to CSV
        const csvData = Papa.unparse(allData, {
            header: true,
            columns: ['businessNumber', 'vpa', 'merchantId', 'shopName', 'amount', 'merchantRefID', 'transDate', 'rrn', 'upiTransID', 'createdAt', 'status', 'payload']
        });

        fs.writeFileSync(TRANSACTIONS_OUTPUT_PATH, csvData, 'utf8');
        console.log(`✅ Transaction payloads saved to ${TRANSACTIONS_OUTPUT_PATH}`);
        
        // Also log the data for verification
        console.log('\n📋 Generated Transaction Payloads:');
        const newPayloads = transactionPayloads.slice(-transactionPayloads.length);
        newPayloads.forEach((transaction, index) => {
            console.log(`${index + 1}. Business: ${transaction.businessNumber} | VPA: ${transaction.vpa} | Amount: ₹${transaction.amount} | Status: ${transaction.status}`);
        });
        
    } catch (error) {
        console.error('❌ Error saving transaction payloads to CSV:', error.message);
    }
}

// Main function to generate and send transactions
async function generateAndSendTransactions(vpa, amount, businessNumber, merchantId, shopName) {
    const now = new Date();
    const startDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const endDate = now;

    const amounts = splitAmount(amount);
    const payloads = [];

    for (let amt of amounts) {
        const payload = {
            KVBData: {
                ...fixedData,
                Amount: amt.toString(),
                PayeeAddr: vpa,
                MerchantRefID: generateMerchantRefId("REF"),
                TransDate: randomDate(startDate, endDate),
                RRN: generateRRN(),
                UpiTransID: generateUpiTransID(),
            },
        };
        payloads.push(payload);

        // Store payload data for CSV
        transactionPayloads.push({
            businessNumber,
            vpa,
            merchantId,
            shopName: shopName || 'N/A',
            amount: amt,
            merchantRefID: payload.KVBData.MerchantRefID,
            transDate: payload.KVBData.TransDate,
            rrn: payload.KVBData.RRN,
            upiTransID: payload.KVBData.UpiTransID,
            createdAt: new Date().toISOString(),
            status: 'Pending',
            payload: JSON.stringify(payload)
        });
    }

    console.log(`✅ Generated ${payloads.length} transaction payloads for ${vpa}`);
    printSection(`Generated Payloads for ${vpa}`, payloads);

    // Send them one by one
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < payloads.length; i++) {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payloads[i]),
            });
            
            console.log(`✅ Sent payload ${i + 1}/${payloads.length} for ${vpa}: Status ${response.status}`);
            
            // Update status in stored payloads
            const payloadIndex = transactionPayloads.length - payloads.length + i;
            if (response.ok) {
                transactionPayloads[payloadIndex].status = 'Success';
                successCount++;
            } else {
                transactionPayloads[payloadIndex].status = 'Failed';
                failCount++;
            }
            
        } catch (error) {
            console.error(`❌ Error sending payload ${i + 1} for ${vpa}:`, error.message);
            
            // Update status in stored payloads
            const payloadIndex = transactionPayloads.length - payloads.length + i;
            transactionPayloads[payloadIndex].status = 'Error';
            failCount++;
        }
    }

    return { successCount, failCount, totalPayloads: payloads.length };
}

// Function to create transactions for all merchants of a phone number
async function createTransactionsForMerchant(merchantConfig, merchantIndex, totalMerchants) {
    try {
        phoneNumber = merchantConfig.businessNumber;
        printProgress(merchantIndex, totalMerchants, `GENERATING TRANSACTIONS FOR ${phoneNumber}`);

        const payload = {
            businessPhone: phoneNumber,
            apiKey: apiKey2
        };
        
        printSection("Get All User Accounts Payload", payload);
        const phoneByMerchant = await getAllUserAccounts(payload);
        printSection("Get All User Accounts Response", phoneByMerchant);

        if (phoneByMerchant.Success) {
            const merchants = phoneByMerchant.Success.map((item, index) => ({
                businessName: item.businessName,
                merchantId: item.merchantId,
                businessVPA: item.businessVPA
            }));
            
            storeNameMerchantId = merchants;
            console.log(`📊 Found ${merchants.length} merchants for ${phoneNumber}`);

            if (merchantConfig.transactionAmount <= 100) {
                console.log("❌ The transaction amount must be greater than 100.");
                return;
            }

            let totalSuccess = 0;
            let totalFailed = 0;
            let totalPayloads = 0;

            // Generate transactions for each merchant
            for (const store of merchants) {
                console.log(`\n💳 Generating transactions for VPA: ${store.businessVPA}`);
                
                const result = await generateAndSendTransactions(
                    store.businessVPA, 
                    merchantConfig.transactionAmount, 
                    phoneNumber,
                    store.merchantId,
                    store.businessName
                );
                
                totalSuccess += result.successCount;
                totalFailed += result.failCount;
                totalPayloads += result.totalPayloads;
                
                console.log(`✅ Completed transactions for ${store.businessVPA}: ${result.successCount}/${result.totalPayloads} successful`);
            }

            console.log(`\n📊 Summary for ${phoneNumber}:`);
            console.log(`   Total payloads: ${totalPayloads}`);
            console.log(`   Successful: ${totalSuccess}`);
            console.log(`   Failed: ${totalFailed}`);

        } else {
            console.log("❌ Error getting merchant accounts:", phoneByMerchant.Error);
        }
    } catch (error) {
        console.error(`❌ Error processing transactions for ${phoneNumber}:`, error.message);
    }
}

// Main function to create transactions
export async function createTransactions(csvFilePath = INPUT_CSV_PATH) {
    try {
        console.log("\n🚀 Starting Automated Transaction Generation...");
        
        // Read configuration from CSV
        await readInputCSV(csvFilePath);
        
        if (config.merchants.length === 0) {
            throw new Error("No valid merchants found in CSV file for transactions");
        }
        
        console.log(`📱 Processing transactions for ${config.merchants.length} merchants`);
        
        // Process each merchant for transactions
        for (let i = 0; i < config.merchants.length; i++) {
            const merchant = config.merchants[i];
            await createTransactionsForMerchant(merchant, i + 1, config.merchants.length);
            
            // Add delay between merchants to avoid rate limiting
            if (i < config.merchants.length - 1) {
                console.log("\n⏳ Waiting before processing next merchant...");
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // Save transaction payloads to CSV
        await saveTransactionPayloadsToCSV();
        
        // Final summary
        const successfulTransactions = transactionPayloads.filter(t => t.status === 'Success').length;
        const failedTransactions = transactionPayloads.filter(t => t.status !== 'Success').length;
        
        console.log("\n" + "=".repeat(80));
        console.log("🎉 TRANSACTION GENERATION COMPLETED SUCCESSFULLY! 🎉");
        console.log("=".repeat(80));
        console.log(`📊 Summary:`);
        console.log(`   📱 Merchants processed: ${config.merchants.length}`);
        console.log(`   💳 Total transaction payloads: ${transactionPayloads.length}`);
        console.log(`   ✅ Successful transactions: ${successfulTransactions}`);
        console.log(`   ❌ Failed transactions: ${failedTransactions}`);
        console.log(`   📁 Data saved to: ${TRANSACTIONS_OUTPUT_PATH}`);
        
        return {
            success: true,
            processed: config.merchants.length,
            totalPayloads: transactionPayloads.length,
            successfulTransactions,
            failedTransactions,
            outputFile: TRANSACTIONS_OUTPUT_PATH
        };
        
    } catch (error) {
        console.error("❌ Transaction generation failed:", error.message);
        return {
            success: false,
            error: error.message,
            totalPayloads: transactionPayloads.length
        };
    }
}

// Run the transaction automation
const csvFilePath = process.argv[2] || INPUT_CSV_PATH;
createTransactions(csvFilePath);