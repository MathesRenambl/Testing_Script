import dotenv from 'dotenv';
import Papa from 'papaparse';
import fs from 'fs';
import Papa from 'papaparse';
import fs from 'fs';
import { getAllUserAccounts } from './api.js';

dotenv.config();

// CSV file paths
const INPUT_CSV_PATH = './input_config.csv';
const TRANSACTIONS_OUTPUT_PATH = './promiseall_transaction.csv';

// Load Testing Configuration
const LOAD_TEST_CONFIG = {

    requestsPerSecond: 20, // Default requests per second
    intervalBetweenBatches: 0, // 1 second between batches
    maxConcurrentRequests: 50 // Maximum concurrent requests limit
};

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

const endpoint = `${process.env.YAHVIPAY_ADMIN_BACKEND}/temp/initiateTransactionOptimise`;

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
            const requestsPerSecond = parseInt(row.requestsPerSecond || LOAD_TEST_CONFIG.requestsPerSecond);
            
            // Validate business number format (10 digits)
            if (businessNumber && /^\d{10}$/.test(businessNumber)) {
                merchants.push({
                    index: index + 1,
                    businessNumber,
                    transactionAmount: transactionAmount > 0 ? transactionAmount : 0,
                    requestsPerSecond: requestsPerSecond > 0 ? requestsPerSecond : LOAD_TEST_CONFIG.requestsPerSecond
                });
            } else {
                console.warn(`⚠️  Row ${index + 1}: Invalid business number '${businessNumber}' - skipping`);
            }
        });

        config = { merchants };

        console.log('\n📊 Input CSV Configuration loaded for load testing:');
        console.log(`📱 Valid merchants: ${merchants.length}`);
        merchants.forEach(m => {
            console.log(`   ${m.businessNumber}: ₹${m.transactionAmount} | ${m.requestsPerSecond} req/sec`);
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
            columns: ['chunkId', 'chunkTimestamp', 'businessNumber', 'vpa', 'merchantId', 'shopName', 'amount', 'merchantRefID', 'transDate', 'rrn', 'upiTransID', 'createdAt', 'status', 'responseTime', 'responseData', 'payload']
        });

        fs.writeFileSync(TRANSACTIONS_OUTPUT_PATH, csvData, 'utf8');
        console.log(`✅ Transaction payloads saved to ${TRANSACTIONS_OUTPUT_PATH}`);
        
        // Also log the data for verification
        console.log('\n📋 Generated Transaction Payloads Summary:');
        const newPayloads = transactionPayloads.slice(-transactionPayloads.length);
        const chunkSummary = {};
        
        newPayloads.forEach((transaction) => {
            if (!chunkSummary[transaction.chunkId]) {
                chunkSummary[transaction.chunkId] = { success: 0, failed: 0, total: 0 };
            }
            chunkSummary[transaction.chunkId].total++;
            if (transaction.status === 'Success') {
                chunkSummary[transaction.chunkId].success++;
            } else {
                chunkSummary[transaction.chunkId].failed++;
            }
        });

        Object.keys(chunkSummary).forEach(chunkId => {
            const chunk = chunkSummary[chunkId];
            console.log(`   ${chunkId}: ${chunk.success}/${chunk.total} successful (${chunk.failed} failed)`);
        });
        
    } catch (error) {
        console.error('❌ Error saving transaction payloads to CSV:', error.message);
    }
}

// Function to create a single API request
async function createSingleAPIRequest(payload, requestsPerSecond, chunkId, chunkTimestamp, requestIndex, vpa, businessNumber, merchantId, shopName) {
    const startTime = Date.now();
    const label = `Request-${chunkId}-${requestIndex}`;
    console.time(label);
    
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        
        const responseTime = Date.now() - startTime;
         
        const responseData = await response.json();
        
        // Store payload data for CSV
        const transactionData = {
            chunkId,
            chunkTimestamp,
            businessNumber,
            vpa,
            merchantId,
            shopName: shopName || 'N/A',
            amount: payload.KVBData.Amount,
            createdAt: new Date().toISOString(),
            status: response.ok ? 'Success' : 'Failed',
            requestsPerSecond : LOAD_TEST_CONFIG.requestsPerSecond,
            responseTime: responseTime,
            merchantRefID: payload.KVBData.MerchantRefID,
            transDate: payload.KVBData.TransDate,
            rrn: payload.KVBData.RRN,
            upiTransID: payload.KVBData.UpiTransID,
            responseData: JSON.stringify(responseData),
            payload: JSON.stringify(payload)
        };
        
        transactionPayloads.push(transactionData);
        console.timeEnd(label)
        console.log(`${chunkId} | Request ${requestIndex}: ${response.status} (${responseTime}ms) - ${vpa}`);
        
        return {
            success: response.ok,
            responseTime,
            responseData,
            status: response.status
        };
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // Store payload data for CSV with error
        const transactionData = {
            chunkId,
            chunkTimestamp,
            businessNumber,
            vpa,
            merchantId,
            shopName: shopName || 'N/A',
            amount: payload.KVBData.Amount,
            createdAt: new Date().toISOString(),
            status: 'Error',
            requestsPerSecond : LOAD_TEST_CONFIG.requestsPerSecond,
            responseTime: responseTime,
            merchantRefID: payload.KVBData.MerchantRefID,
            transDate: payload.KVBData.TransDate,
            rrn: payload.KVBData.RRN,
            upiTransID: payload.KVBData.UpiTransID,
            responseData: JSON.stringify({ error: error.message }),
            payload: JSON.stringify(payload)
        };
        
        transactionPayloads.push(transactionData);
        console.timeEnd(label)
        console.error(`${chunkId} | Request ${requestIndex}: ERROR (${responseTime}ms) - ${error.message}`);
        
        return {
            success: false,
            responseTime,
            error: error.message
        };
    }
}

async function makeChunkedAPICalls(payloads, requestsPerSecond, vpa, businessNumber, merchantId, shopName) {
    const totalPayloads = payloads.length;
    let chunkStartIndex = 0;
    
    // Keep track of all the promises
    const allResults = [];
    let chunkCounter = 1;
    
    while (chunkStartIndex < totalPayloads) {
        const chunkId = `CHUNK_${chunkCounter}_${vpa.replace('@', '_').replace('.', '_')}`;
        const chunkTimestamp = new Date().toISOString();
        
        console.log(`\n🚀 ${chunkId}: Generating ${requestsPerSecond} concurrent requests for ${vpa}`);
        
        // Calculate the chunk size (this will be either requestsPerSecond or less for the final chunk)
        const chunkEndIndex = Math.min(chunkStartIndex + requestsPerSecond, totalPayloads);

        // Get the chunk of payloads for this batch
        const payloadChunk = payloads.slice(chunkStartIndex, chunkEndIndex);

        // Create the promises for this chunk
        const chunkPromises = payloadChunk.map((payload, index) => {
            return createSingleAPIRequest(
                payload,
                requestsPerSecond,
                chunkId,
                chunkTimestamp,
                chunkStartIndex + index + 1,
                vpa,
                businessNumber,
                merchantId,
                shopName
            );
        });

        // Wait for all requests in this chunk to complete
        const chunkResults = await Promise.all(chunkPromises);
        allResults.push(...chunkResults);

        // Move the start index to the next chunk
        chunkStartIndex += requestsPerSecond;
        chunkCounter++;
        
        console.log(`✅ ${chunkId}: Completed ${payloadChunk.length} concurrent requests for ${vpa}`);
        
        // Add delay between chunks if not the last chunk
        if (chunkStartIndex < totalPayloads) {
            console.log(`⏳ Waiting ${LOAD_TEST_CONFIG.intervalBetweenBatches}ms before next chunk...`);
            await new Promise(resolve => setTimeout(resolve, LOAD_TEST_CONFIG.intervalBetweenBatches));
        }
    }

    return allResults;
}

// Function to generate concurrent API requests (load testing)
async function generateConcurrentAPIRequests(vpa, amount, businessNumber, merchantId, shopName, requestsPerSecond) {
    const now = new Date();
    const startDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const endDate = now;
    
    const amounts = splitAmount(amount);
    console.log(`💰 Split amount ${amount} into ${amounts.length} parts:`, amounts);
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
    }

    // Execute all requests in chunks
    const startTime = Date.now();
    const results = await makeChunkedAPICalls(
        payloads,
        requestsPerSecond,
        vpa,
        businessNumber,
        merchantId,
        shopName
    );

    const totalTime = Date.now() - startTime;
    
    // Calculate statistics
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    
    console.log(`\n📊 Results for ${vpa}:`);
    console.log(`   Total requests: ${results.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   Requests per second achieved: ${(results.length / (totalTime / 1000)).toFixed(2)}`);

    return { successCount, failCount, totalRequests: results.length, avgResponseTime, totalTime };
}

// Function to create transactions for all merchants of a phone number with load testing
async function createLoadTestTransactionsForMerchant(merchantConfig, merchantIndex, totalMerchants) {
    try {
        phoneNumber = merchantConfig.businessNumber;
        const requestsPerSecond = merchantConfig.requestsPerSecond;
        
        printProgress(merchantIndex, totalMerchants, `LOAD TESTING TRANSACTIONS FOR ${phoneNumber} (${requestsPerSecond} req/sec)`);

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

            if (merchantConfig.transactionAmount <= 0) {
                console.log("❌ The transaction amount must be greater than 0.");
                return;
            }

            let totalSuccess = 0;
            let totalFailed = 0;
            let totalRequests = 0;
            let totalResponseTime = 0;

            // Generate concurrent transactions for each merchant
            for (const store of merchants) {
                console.log(`\n💳 Load testing transactions for VPA: ${store.businessVPA}`);
                
                const result = await generateConcurrentAPIRequests(
                    store.businessVPA, 
                    merchantConfig.transactionAmount, 
                    phoneNumber,
                    store.merchantId,
                    store.businessName,
                    requestsPerSecond
                );
                
                totalSuccess += result.successCount;
                totalFailed += result.failCount;
                totalRequests += result.totalRequests;
                totalResponseTime += result.avgResponseTime;
                
                // Wait between merchants to avoid overwhelming the server
                if (merchants.indexOf(store) < merchants.length - 1) {
                    console.log(`⏳ Waiting ${LOAD_TEST_CONFIG.intervalBetweenBatches}ms before next VPA...`);
                    await new Promise(resolve => setTimeout(resolve, LOAD_TEST_CONFIG.intervalBetweenBatches));
                }
            }

            const avgResponseTime = totalResponseTime / merchants.length;

            console.log(`\n📊 Load Test Summary for ${phoneNumber}:`);
            console.log(`   Total requests: ${totalRequests}`);
            console.log(`   Successful: ${totalSuccess} (${((totalSuccess/totalRequests)*100).toFixed(2)}%)`);
            console.log(`   Failed: ${totalFailed} (${((totalFailed/totalRequests)*100).toFixed(2)}%)`);
            console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
            console.log(`   Requests per second: ${requestsPerSecond}`);

        } else {
            console.log("❌ Error getting merchant accounts:", phoneByMerchant.Error);
        }
    } catch (error) {
        console.error(`❌ Error processing load test transactions for ${phoneNumber}:`, error.message);
    }
}

// Main function to create load testing transactions
export async function createLoadTestTransactions(csvFilePath = INPUT_CSV_PATH) {
    try {
        console.log("\n🚀 Starting Load Testing Transaction Generation...");
        
        // Read configuration from CSV
        await readInputCSV(csvFilePath);
        
        if (config.merchants.length === 0) {
            throw new Error("No valid merchants found in CSV file for load testing");
        }
        
        console.log(`📱 Processing load test transactions for ${config.merchants.length} merchants`);
        
        // Process each merchant for load testing transactions
        for (let i = 0; i < config.merchants.length; i++) {
            const merchant = config.merchants[i];
            await createLoadTestTransactionsForMerchant(merchant, i + 1, config.merchants.length);
            
            // Add delay between merchants to avoid rate limiting
            if (i < config.merchants.length - 1) {
                console.log("\n⏳ Waiting before processing next merchant...");
                await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay between merchants
            }
        }
        
        // Save transaction payloads to CSV
        await saveTransactionPayloadsToCSV();
        
        // Final summary
        const successfulTransactions = transactionPayloads.filter(t => t.status === 'Success').length;
        const failedTransactions = transactionPayloads.filter(t => t.status !== 'Success').length;
        const avgResponseTime = transactionPayloads.length > 0 ? 
            transactionPayloads.reduce((sum, t) => sum + parseFloat(t.responseTime || 0), 0) / transactionPayloads.length : 0;
        
        // Chunk analysis
        const chunkStats = {};
        transactionPayloads.forEach(t => {
            if (!chunkStats[t.chunkId]) {
                chunkStats[t.chunkId] = { total: 0, success: 0, failed: 0 };
            }
            chunkStats[t.chunkId].total++;
            if (t.status === 'Success') {
                chunkStats[t.chunkId].success++;
            } else {
                chunkStats[t.chunkId].failed++;
            }
        });
        
        console.log("\n" + "=".repeat(80));
        console.log("🎉 LOAD TESTING COMPLETED SUCCESSFULLY! 🎉");
        console.log("=".repeat(80));
        console.log(`📊 Summary:`);
        console.log(`   📱 Merchants processed: ${config.merchants.length}`);
        console.log(`   💳 Total transaction requests: ${transactionPayloads.length}`);
        console.log(`   ✅ Successful transactions: ${successfulTransactions} (${transactionPayloads.length > 0 ? ((successfulTransactions/transactionPayloads.length)*100).toFixed(2) : 0}%)`);
        console.log(`   ❌ Failed transactions: ${failedTransactions} (${transactionPayloads.length > 0 ? ((failedTransactions/transactionPayloads.length)*100).toFixed(2) : 0}%)`);
        console.log(`   ⏱️  Average response time: ${avgResponseTime.toFixed(2)}ms`);
        console.log(`   📦 Total chunks processed: ${Object.keys(chunkStats).length}`);
        console.log(`   📁 Data saved to: ${TRANSACTIONS_OUTPUT_PATH}`);
        
        console.log(`\n📦 Chunk Performance:`);
        Object.keys(chunkStats).forEach(chunkId => {
            const chunk = chunkStats[chunkId];
            console.log(`   ${chunkId}: ${chunk.success}/${chunk.total} successful (${((chunk.success/chunk.total)*100).toFixed(1)}%)`);
        });
        
        return {
            success: true,
            processed: config.merchants.length,
            totalRequests: transactionPayloads.length,
            successfulTransactions,
            failedTransactions,
            avgResponseTime,
            chunksProcessed: Object.keys(chunkStats).length,
            outputFile: TRANSACTIONS_OUTPUT_PATH
        };
        
    } catch (error) {
        console.error("❌ Load testing failed:", error.message);
        return {
            success: false,
            error: error.message,
            totalRequests: transactionPayloads.length
        };
    }
}

// Run the load testing automation
const csvFilePath = process.argv[2] || INPUT_CSV_PATH;
createLoadTestTransactions(csvFilePath);