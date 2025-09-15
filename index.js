import dotenv from 'dotenv';
import Papa from 'papaparse';
import fs from 'fs';
import { allowMultipleAccount, isRegisteredBusiness, login, loginAccountOTP, setBusinessVPA, updateAddressDetails, updateBusinessDetails, updateUserDetails, verifyFlags } from './api.js';

dotenv.config();

const storeNameMerchantId = [];
const storeVpa = [];
const apiKey2 = process.env.API_KEY2;
var numberOfShopsCount;
var phoneNumber = "";
var createdMerchantId = "";
var apiKey = "";

// CSV file paths
const INPUT_CSV_PATH = './input_config.csv';
const MERCHANTS_OUTPUT_PATH = './created_merchants.csv';

// Configuration object to store CSV data
let config = {
    merchants: []
};

function printSection(title, data) {
    console.log(`\n========== 📌 ${title.toUpperCase()} ==========\n`);
    console.log(JSON.stringify(data, null, 2));
}

function printShopCreationMessage(shopNumber, phoneNum) {
    const message = `========== 📌 SHOP ${shopNumber} CREATED SUCCESSFULLY FOR ${phoneNum} ==========`;
    const borderLine = "=".repeat(message.length);
    console.log(borderLine); 
    console.log(message);
    console.log(borderLine);
}

function printPhoneProcessingMessage(phoneNum, index, total) {
    const message = `========== 📱 PROCESSING PHONE NUMBER ${index}/${total}: ${phoneNum} ==========`;
    const borderLine = "=".repeat(message.length);
    console.log(borderLine); 
    console.log(message);
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
            const noOfShops = parseInt(row.noOfShops || row.numberOfShops || row.shops || 1);
            
            // Validate business number format (10 digits)
            if (businessNumber && /^\d{10}$/.test(businessNumber)) {
                merchants.push({
                    index: index + 1,
                    businessNumber,
                    noOfShops
                });
            } else {
                console.warn(`⚠️  Row ${index + 1}: Invalid business number '${businessNumber}' - skipping`);
            }
        });

        config = { merchants };

        console.log('\n📊 Input CSV Configuration loaded:');
        console.log(`📱 Valid merchants: ${merchants.length}`);
        merchants.forEach(m => {
            console.log(`   ${m.businessNumber}: ${m.noOfShops} shops`);
        });

        return config;
    } catch (error) {
        console.error('❌ Error reading input CSV:', error.message);
        throw error;
    }
}

// Function to save merchant data to CSV
async function saveMerchantDataToCSV() {
    try {
        const csvData = [
            ['businessNumber', 'shopName', 'merchantId', 'VPA', 'createdAt'],
            ...storeNameMerchantId.map(store => [
                store.phoneNumber,
                store.storeName || `Business ${store.shopNumber} - ${store.phoneNumber}`,
                store.merchantId,
                storeVpa.find(vpa => vpa.includes(store.merchantId.slice(2))) || '',
                new Date().toISOString()
            ])
        ];

        const csv = Papa.unparse(csvData);
        fs.writeFileSync(MERCHANTS_OUTPUT_PATH, csv, 'utf8');
        console.log(`✅ Merchant data saved to ${MERCHANTS_OUTPUT_PATH}`);
        
        // Also log the data for verification
        console.log('\n📋 Created Merchants Data:');
        storeNameMerchantId.forEach((store, index) => {
            const vpa = storeVpa.find(v => v.includes(store.merchantId.slice(2))) || 'N/A';
            console.log(`${index + 1}. Business: ${store.phoneNumber} | Shop: ${store.storeName || 'Unnamed'} | Merchant ID: ${store.merchantId} | VPA: ${vpa}`);
        });
        
    } catch (error) {
        console.error('❌ Error saving merchant data to CSV:', error.message);
    }
}

// Function to validate phone number format
function validatePhoneNumber(phone) {
    const phonePattern = /^\d{10}$/;
    return phonePattern.test(phone.toString());
}

const updateBusinessDetailsFunction = async (shopNumber, apiCount, phoneNum) => {
    const businessDetailsPayload = {
        businessPhone: phoneNum,
        merchantId: createdMerchantId,
        name: `Business ${shopNumber} - ${phoneNum}`,
        category: "Retail & Shopping",
        subCategory: "Grocery Stores",
        pincode: "600028",
        address: "123 Test Street, Chennai",
        businessType: "FIXED",
        mccCode: "5411"
    };
    printSection(`Update Business Details Payload ${apiCount}`, businessDetailsPayload);
    const businessUpdate = await updateBusinessDetails(businessDetailsPayload);
    const id = storeNameMerchantId[storeNameMerchantId.length - 1];
    storeNameMerchantId[storeNameMerchantId.length - 1] = { ...id, storeName: businessDetailsPayload.name };

    printSection(`Update Business Details Response ${apiCount}`, businessUpdate);
}

const updateUserDetailsFunction = async (phone, shopNumber, apiCount) => {
    const userDetailsPayload = {
        phoneNumber: phoneNumber,
        merchantId: createdMerchantId,
        name: "User",
        phone: `${phone}${shopNumber}`,
        dob: "2000-01-01",
        address: "123 Test Street, Chennai"
    };
    printSection(`Update User Details Payload ${apiCount}`, userDetailsPayload);
    const userUpdate = await updateUserDetails(userDetailsPayload);
    printSection(`Update User Details Response ${apiCount}`, userUpdate);
}

const updateAddressDetailsFunction = async (apiCount) => {
    const addressPayload = {
        address: "123 Street, Chennai",
        latitude: "12.9716",
        longitude: "77.5946",
        apiKey: apiKey,
        businessPhone: phoneNumber,
        merchantId: createdMerchantId
    };
    printSection(`Update Address Details Payload ${apiCount}`, addressPayload);
    const addressUpdate = await updateAddressDetails(addressPayload);
    printSection(`Update Address Details Response ${apiCount}`, addressUpdate);
}

const verifyFlagsFunction = async () => {
    const flagsPayload = {
        businessPhone: phoneNumber,
        merchantId: createdMerchantId
    };
    printSection("Verify Flags Payload", flagsPayload);
    const flagsUpdate = await verifyFlags(flagsPayload);
    printSection("Verify Flags Response", flagsUpdate);
}

const allowMultiFlagFunction = async () => {
    const allowRequired = {
        businessPhone: phoneNumber,
        allowMultiLimit: 10
    };
    printSection("Allow Multiple Account Payload", allowRequired);
    const multiAccount = await allowMultipleAccount(allowRequired);
    printSection("Allow Multiple Account Response", multiAccount);
}

export async function BusinessVPA(merchantId, apiCount) {
    const payLoad = {
        businessPhone: phoneNumber,
        bankName: "KVB",
        verifiedType: "offline",
        activatedBy: "marketing",
        uniqueId: `yahvipay.${merchantId}@kvb`,
        apiKey: apiKey2,
        merchantId: createdMerchantId
    };

    printSection(`Set Business VPA Payload ${apiCount}`, payLoad);
    const data = await setBusinessVPA(payLoad);
    printSection(`Set Business VPA Response ${apiCount}`, data);
    storeVpa.push(payLoad.uniqueId)
}

// Process individual phone number with multiple shops
async function processPhoneNumber(merchantConfig, merchantIndex, totalMerchants) {
    try {
        phoneNumber = merchantConfig.businessNumber;
        printPhoneProcessingMessage(phoneNumber, merchantIndex, totalMerchants);
        
        // Create multiple shops for this phone number
        for (let shopIndex = 1; shopIndex <= merchantConfig.noOfShops; shopIndex++) {
            console.log(`\n🏪 Creating Shop ${shopIndex}/${merchantConfig.noOfShops} for ${phoneNumber}...`);
            
            printSection(`Login Payload ${shopIndex}`, phoneNumber);
            const generate = await login(phoneNumber);
            printSection(`Login Response ${shopIndex}`, generate);

            if (generate.OTP === 'ok') {
                printSection(`Registered Business Payload ${shopIndex}`, phoneNumber);
                const businessData = await isRegisteredBusiness(phoneNumber);
                printSection(`Registered Business Response ${shopIndex}`, businessData);

                const isNewBusiness = businessData.Success.allowMultiFlag === "new";
                const canCreateMultiple = businessData.Success.allowMultiFlag === "yes";

                if (isNewBusiness || canCreateMultiple) {
                    const payLoad = {
                        businessPhone: phoneNumber,
                        token: generate.token,
                        businessName: "",
                        permission: businessData.Success.allowMultiFlag
                    };
                    
                    printSection(`LoginAccountOTP Payload ${shopIndex}`, payLoad);
                    const loginAccountOTPRes = await loginAccountOTP(payLoad);
                    printSection(`LoginAccountOTP Response ${shopIndex}`, loginAccountOTPRes);

                    createdMerchantId = isNewBusiness ? loginAccountOTPRes.merchantId : loginAccountOTPRes.newMerchantId;
                    storeNameMerchantId.push({
                        merchantId: createdMerchantId,
                        storeName: "",
                        phoneNumber: phoneNumber,
                        shopNumber: shopIndex
                    });
                    apiKey = loginAccountOTPRes.apiKey;
                    
                    // Update business details if needed
                    if (loginAccountOTPRes.verifyFlags.business === "no") {
                        await updateBusinessDetailsFunction(shopIndex, shopIndex, phoneNumber);
                    }
                    
                    // Update user details if needed
                    if (loginAccountOTPRes.verifyFlags.user === "no") {
                        await updateUserDetailsFunction(phoneNumber.slice(0, 9), shopIndex, shopIndex);
                    }
                    
                    // Update address details if needed
                    if (loginAccountOTPRes.verifyFlags.location === "no") {
                        await updateAddressDetailsFunction(shopIndex);
                    }
                    
                    // Verify flags if needed
                    if (loginAccountOTPRes.verifyFlags.pan === "no" || loginAccountOTPRes.verifyFlags.bank === "no") {
                        await verifyFlagsFunction();
                    }
                    
                    // Allow multiple accounts for first shop only
                    if (shopIndex === 1 && merchantConfig.noOfShops > 1) {
                        await allowMultiFlagFunction();
                    }
                    
                    // Set up Business VPA
                    await BusinessVPA(createdMerchantId.slice(2), shopIndex);
                    
                    printShopCreationMessage(shopIndex, phoneNumber);
                    
                } else {
                    console.log(`⚠️  Cannot create shop ${shopIndex} - AllowMultiFlag is 'no' for ${phoneNumber}`);
                    break; // Stop creating more shops for this number
                }
            } else {
                console.log(`❌ Login failed for ${phoneNumber}, shop ${shopIndex}`);
            }
            
            // Add small delay between shop creations
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`\n✅ Completed processing ${phoneNumber}`);
        console.log(`📊 Total stores created so far: ${storeNameMerchantId.length}`);
        console.log(`📊 Total VPAs created so far: ${storeVpa.length}`);
        
    } catch (error) {
        console.error(`❌ Error processing phone number ${phoneNumber}:`, error.message);
    }
}

// Main automation function for merchant creation
export async function AutomatedMerchantCreation(csvFilePath = INPUT_CSV_PATH) {
    try {
        console.log("\n🚀 Starting Automated Merchant Creation...");
        
        // Read configuration from CSV
        await readInputCSV(csvFilePath);
        
        if (config.merchants.length === 0) {
            throw new Error("No valid merchants found in CSV file");
        }
        
        console.log(`📱 Processing ${config.merchants.length} merchants`);
        
        // Process each merchant
        for (let i = 0; i < config.merchants.length; i++) {
            const merchant = config.merchants[i];
            await processPhoneNumber(merchant, i + 1, config.merchants.length);
            
            // Add delay between merchants to avoid rate limiting
            if (i < config.merchants.length - 1) {
                console.log("\n⏳ Waiting before processing next merchant...");
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        // Save merchant data to CSV
        await saveMerchantDataToCSV();
        
        // Final summary
        console.log("\n" + "=".repeat(80));
        console.log("🎉 MERCHANT CREATION COMPLETED SUCCESSFULLY! 🎉");
        console.log("=".repeat(80));
        console.log(`📊 Summary:`);
        console.log(`   📱 Merchants processed: ${config.merchants.length}`);
        console.log(`   🏪 Total merchants created: ${storeNameMerchantId.length}`);
        console.log(`   💳 Total VPAs created: ${storeVpa.length}`);
        console.log(`   📁 Data saved to: ${MERCHANTS_OUTPUT_PATH}`);
        
        return {
            success: true,
            processed: config.merchants.length,
            merchantsCreated: storeNameMerchantId.length,
            vpasCreated: storeVpa.length,
            merchants: storeNameMerchantId,
            vpas: storeVpa,
            outputFile: MERCHANTS_OUTPUT_PATH
        };
        
    } catch (error) {
        console.error("❌ Merchant creation failed:", error.message);
        return {
            success: false,
            error: error.message,
            merchantsCreated: storeNameMerchantId.length,
            vpasCreated: storeVpa.length
        };
    }
}

// Run the automation
const csvFilePath = process.argv[2] || INPUT_CSV_PATH;
AutomatedMerchantCreation(csvFilePath);