import dotenv from 'dotenv';
import Papa from 'papaparse';
import fs from 'fs';
import { addCharge, getAllUserAccounts } from './api.js';

dotenv.config();

// CSV file paths
const INPUT_CSV_PATH = './input_config.csv';
const CHARGES_OUTPUT_PATH = './applied_charges.csv';

// Configuration
const chargeTypeOptions = ["device", "loan"];
const chargeFrequencyOptions = ["daily", "monthly", "onetime"];
var storeNameMerchantId = [];
const apiKey2 = process.env.API_KEY2;
var phoneNumber = "";

// Store applied charges for CSV output
const appliedCharges = [];

// Configuration object
let config = {
    merchants: []
};

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
            const chargeAmount = parseFloat(row.chargeAmount || row.amount || 0);
            const chargeType = (row.chargeType || row.type || 'device').toString().trim().toLowerCase();
            const chargeFrequency = (row.chargeFrequency || row.frequency || 'monthly').toString().trim().toLowerCase();
            
            // Validate business number format (10 digits)
            if (businessNumber && /^\d{10}$/.test(businessNumber)) {
                // Validate charge type and frequency
                const validChargeType = chargeTypeOptions.includes(chargeType) ? chargeType : 'device';
                const validChargeFrequency = chargeFrequencyOptions.includes(chargeFrequency) ? chargeFrequency : 'monthly';
                
                merchants.push({
                    index: index + 1,
                    businessNumber,
                    chargeAmount: chargeAmount > 0 ? chargeAmount : 100, // Default charge amount
                    chargeType: validChargeType,
                    chargeFrequency: validChargeFrequency
                });
            } else {
                console.warn(`⚠️  Row ${index + 1}: Invalid business number '${businessNumber}' - skipping`);
            }
        });

        config = { merchants };

        console.log('\n📊 Input CSV Configuration loaded for charges:');
        console.log(`📱 Valid merchants: ${merchants.length}`);
        merchants.forEach(m => {
            console.log(`   ${m.businessNumber}: ₹${m.chargeAmount} ${m.chargeType}/${m.chargeFrequency}`);
        });

        return config;
    } catch (error) {
        console.error('❌ Error reading input CSV:', error.message);
        throw error;
    }
}

// Function to save charge data to CSV
async function saveChargeDataToCSV() {
    try {
        const csvData = [
            ['businessNumber', 'merchantId', 'shopName', 'chargeName', 'frequency', 'amount', 'appliedAt', 'status', 'response'],
            ...appliedCharges.map(charge => [
                charge.businessPhone,
                charge.merchantId,
                charge.shopName || 'N/A',
                charge.chargeName,
                charge.frequency,
                charge.amount,
                charge.appliedAt,
                charge.status,
                JSON.stringify(charge.response || {})
            ])
        ];

        const csv = Papa.unparse(csvData);
        fs.writeFileSync(CHARGES_OUTPUT_PATH, csv, 'utf8');
        console.log(`✅ Charge data saved to ${CHARGES_OUTPUT_PATH}`);
        
        // Also log the data for verification
        console.log('\n📋 Applied Charges Data:');
        appliedCharges.forEach((charge, index) => {
            console.log(`${index + 1}. Business: ${charge.businessPhone} | Merchant: ${charge.merchantId} | Charge: ₹${charge.amount} ${charge.chargeName}/${charge.frequency} | Status: ${charge.status}`);
        });
        
    } catch (error) {
        console.error('❌ Error saving charge data to CSV:', error.message);
    }
}

// Function to apply charges to all merchants for a phone number
async function applyChargesToMerchants(merchantConfig, merchantIndex, totalMerchants) {
    try {
        phoneNumber = merchantConfig.businessNumber;
        printProgress(merchantIndex, totalMerchants, `APPLYING CHARGES FOR ${phoneNumber}`);

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

            if (merchantConfig.chargeAmount <= 0) {
                console.log("❌ The charge amount must be greater than 0.");
                return;
            }

            // Apply charges to each merchant
            for (const store of merchants) {
                const chargePayload = {
                    apiKey: apiKey2,
                    businessPhone: phoneNumber,
                    merchantId: store.merchantId,
                    chargeName: merchantConfig.chargeType,
                    frequency: merchantConfig.chargeFrequency,
                    amount: merchantConfig.chargeAmount.toString()
                };

                printSection(`Add Charge Payload for ${store.merchantId}`, chargePayload);
                
                try {
                    const chargeResponse = await addCharge(chargePayload);
                    printSection(`Add Charge Response for ${store.merchantId}`, chargeResponse);

                    // Store the charge data for CSV
                    appliedCharges.push({
                        businessPhone: phoneNumber,
                        merchantId: store.merchantId,
                        shopName: store.businessName,
                        chargeName: merchantConfig.chargeType,
                        frequency: merchantConfig.chargeFrequency,
                        amount: merchantConfig.chargeAmount,
                        appliedAt: new Date().toISOString(),
                        status: chargeResponse.Success ? 'Success' : 'Failed',
                        response: chargeResponse
                    });

                    console.log(`✅ Charge applied successfully to merchant ${store.merchantId}`);
                } catch (error) {
                    console.error(`❌ Error applying charge to merchant ${store.merchantId}:`, error.message);
                    
                    // Store failed charge data
                    appliedCharges.push({
                        businessPhone: phoneNumber,
                        merchantId: store.merchantId,
                        shopName: store.businessName,
                        chargeName: merchantConfig.chargeType,
                        frequency: merchantConfig.chargeFrequency,
                        amount: merchantConfig.chargeAmount,
                        appliedAt: new Date().toISOString(),
                        status: 'Error',
                        response: { error: error.message }
                    });
                }
            }
        } else {
            console.log("❌ Error getting merchant accounts:", phoneByMerchant.Error);
        }
    } catch (error) {
        console.error(`❌ Error processing charges for ${phoneNumber}:`, error.message);
    }
}

// Main function to add charges
export async function addCharges(csvFilePath = INPUT_CSV_PATH) {
    try {
        console.log("\n🚀 Starting Automated Charge Addition...");
        
        // Read configuration from CSV
        await readInputCSV(csvFilePath);
        
        if (config.merchants.length === 0) {
            throw new Error("No valid merchants found in CSV file for charges");
        }
        
        console.log(`📱 Processing charges for ${config.merchants.length} merchants`);
        
        // Process each merchant for charges
        for (let i = 0; i < config.merchants.length; i++) {
            const merchant = config.merchants[i];
            await applyChargesToMerchants(merchant, i + 1, config.merchants.length);
            
            // Add delay between merchants to avoid rate limiting
            if (i < config.merchants.length - 1) {
                console.log("\n⏳ Waiting before processing next merchant...");
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }
        
        // Save charge data to CSV
        await saveChargeDataToCSV();
        
        // Final summary
        console.log("\n" + "=".repeat(80));
        console.log("🎉 CHARGE ADDITION COMPLETED SUCCESSFULLY! 🎉");
        console.log("=".repeat(80));
        console.log(`📊 Summary:`);
        console.log(`   📱 Merchants processed: ${config.merchants.length}`);
        console.log(`   💰 Total charges applied: ${appliedCharges.length}`);
        console.log(`   ✅ Successful charges: ${appliedCharges.filter(c => c.status === 'Success').length}`);
        console.log(`   ❌ Failed charges: ${appliedCharges.filter(c => c.status !== 'Success').length}`);
        console.log(`   📁 Data saved to: ${CHARGES_OUTPUT_PATH}`);
        
        return {
            success: true,
            processed: config.merchants.length,
            chargesApplied: appliedCharges.length,
            successfulCharges: appliedCharges.filter(c => c.status === 'Success').length,
            failedCharges: appliedCharges.filter(c => c.status !== 'Success').length,
            outputFile: CHARGES_OUTPUT_PATH
        };
        
    } catch (error) {
        console.error("❌ Charge addition failed:", error.message);
        return {
            success: false,
            error: error.message,
            chargesApplied: appliedCharges.length
        };
    }
}

// Run the charge automation
const csvFilePath = process.argv[2] || INPUT_CSV_PATH;
addCharges(csvFilePath);