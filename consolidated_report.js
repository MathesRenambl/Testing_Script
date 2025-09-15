import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

// CSV file paths
const MERCHANTS_CSV_PATH = './created_merchants.csv';
const CHARGES_CSV_PATH = './applied_charges.csv';
const TRANSACTIONS_CSV_PATH = './transaction_payloads.csv';
const CONSOLIDATED_OUTPUT_PATH = process.argv[2] || './consolidated_report.csv';

// Ensure output directory exists
const ensureOutputDirectory = (filePath) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created output directory: ${dir}`);
    }
};

// Function to read and parse a CSV file
async function readCSV(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`CSV file not found at path: ${filePath}`);
        }

        const csvData = fs.readFileSync(filePath, 'utf8');
        const parseResult = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true
        });

        if (parseResult.errors.length > 0) {
            console.error(`CSV parsing errors for ${filePath}:`, parseResult.errors);
        }

        return parseResult.data;
    } catch (error) {
        console.error(`❌ Error reading CSV file ${filePath}:`, error.message);
        throw error;
    }
}

// Function to aggregate data and generate consolidated CSV
async function generateConsolidatedReport() {
    try {
        console.log("\n🚀 Starting Consolidated Report Generation...");

        // Ensure output directory exists
        ensureOutputDirectory(CONSOLIDATED_OUTPUT_PATH);

        // Read all input CSV files
        const merchantsData = await readCSV(MERCHANTS_CSV_PATH);
        const chargesData = await readCSV(CHARGES_CSV_PATH);
        const transactionsData = await readCSV(TRANSACTIONS_CSV_PATH);

        // Aggregate charges and transactions by merchantId
        const merchantMap = {};

        // Process merchants data
        merchantsData.forEach(merchant => {
            const { businessNumber, shopName, merchantId, VPA } = merchant;
            merchantMap[merchantId] = {
                businessNumber: businessNumber.toString(),
                shopName: shopName || 'N/A',
                merchantId,
                vpa: VPA || 'N/A',
                charges: [],
                transactions: []
            };
        });

        // Process charges data
        chargesData.forEach(charge => {
            if (merchantMap[charge.merchantId]) {
                merchantMap[charge.merchantId].charges.push({
                    amount: charge.amount,
                    chargeName: charge.chargeName,
                    frequency: charge.frequency,
                    status: charge.status
                });
            }
        });

        // Process transactions data
        transactionsData.forEach(transaction => {
            if (merchantMap[transaction.merchantId]) {
                merchantMap[transaction.merchantId].transactions.push({
                    amount: transaction.amount,
                    status: transaction.status
                });
            }
        });

        // Prepare data for CSV
        const csvData = [
            ['businessNumber', 'shopName', 'merchantId', 'vpa', 'charges', 'transactions'],
            ...Object.values(merchantMap).map(merchant => {
                // Format charges as a string
                const chargesString = merchant.charges.length > 0
                    ? merchant.charges.map(c => 
                        `${c.chargeName}: ₹${c.amount} (${c.frequency}, ${c.status})`
                      ).join('; ')
                    : 'None';

                // Calculate total sum of successful transactions
                const totalSuccessfulTransactions = merchant.transactions
                    .filter(t => t.status === 'Success')
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                // Format transactions as total sum of successful transactions
                const transactionsString = totalSuccessfulTransactions > 0
                    ? `₹${totalSuccessfulTransactions} (Success)`
                    : 'None';

                return [
                    merchant.businessNumber,
                    merchant.shopName,
                    merchant.merchantId,
                    merchant.vpa,
                    chargesString,
                    transactionsString
                ];
            })
        ];

        // Write to CSV
        try {
            const csv = Papa.unparse(csvData);
            fs.writeFileSync(CONSOLIDATED_OUTPUT_PATH, csv, 'utf8');
            console.log(`✅ Consolidated report automatically generated at ${CONSOLIDATED_OUTPUT_PATH}`);
        } catch (error) {
            throw new Error(`Failed to write CSV file: ${error.message}`);
        }

        // Log summary
        console.log("\n📋 Consolidated Report Summary:");
        Object.values(merchantMap).forEach((merchant, index) => {
            const totalSuccessfulTransactions = merchant.transactions
                .filter(t => t.status === 'Success')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            console.log(`${index + 1}. Business: ${merchant.businessNumber} | Shop: ${merchant.shopName} | Merchant ID: ${merchant.merchantId} | VPA: ${merchant.vpa}`);
            console.log(`   Charges: ${merchant.charges.length > 0 ? merchant.charges.length + ' applied' : 'None'}`);
            console.log(`   Transactions: ${totalSuccessfulTransactions > 0 ? `₹${totalSuccessfulTransactions} (Success)` : 'None'}`);
        });

        console.log("\n" + "=".repeat(80));
        console.log("🎉 CONSOLIDATED REPORT GENERATION COMPLETED SUCCESSFULLY! 🎉");
        console.log("=".repeat(80));
        console.log(`📊 Summary:`);
        console.log(`   🏪 Total merchants: ${Object.keys(merchantMap).length}`);
        console.log(`   📁 Data saved to: ${CONSOLIDATED_OUTPUT_PATH}`);

        return {
            success: true,
            merchantsProcessed: Object.keys(merchantMap).length,
            outputFile: CONSOLIDATED_OUTPUT_PATH
        };

    } catch (error) {
        console.error("❌ Consolidated report generation failed:", error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the consolidated report generation
generateConsolidatedReport();