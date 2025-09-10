import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { addCharge, allowMultipleAccount, isPincodeValid, isRegisteredBusiness, login, loginAccountOTP, setBusinessVPA, updateAddressDetails, updateBusinessDetails, updateUserDetails, verifyFlags } from './api.js';
import { generateAndSendTransactions } from './transaction.js';

dotenv.config();

const allowMultiShopOptions = ["yes", "no"]
const chargeTypeOptions = ["device", "loan"]
const chargeFrequencyOptions = ["daily", "monthly", "onetime"]
var chargeAmount;
const storeNameMerchantId = [];
const storeVpa = [];
const apiKey2 = process.env.API_KEY2;
var numberOfShopsCount;
var phoneNumber = "8839868555";
var createdMerchantId = "";
var apiKey = "";

function printSection(title, data) {
    console.log(`\n========== 📌 ${title.toUpperCase()} ==========\n`);
    console.log(JSON.stringify(data, null, 2));
}

function printShopCreationMessage(shopNumber) {
    const message = `========== 📌 SHOP ${shopNumber} CREATED SUCCESSFULLY ==========`;

    const borderLine = "=".repeat(message.length);
    console.log(borderLine); 
    console.log(message);
    console.log(borderLine);
}

const updateBusinessDetailsFunction = async (shopNumber, apiCount) => {
    const businessDetailsPayload = {
        businessPhone: phoneNumber,
        merchantId: createdMerchantId,
        name: `Gokul Business ${shopNumber}`,
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
        name: "Gokul",
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

export async function addCharges() {
    for (const store of storeNameMerchantId) {
        const { chargeType } = await inquirer.prompt([
            {
                type: 'list',
                name: 'chargeType',
                message: 'Select charge type:',
                choices: chargeTypeOptions
            }
        ]);

        // Prompt user to select charge frequency
        const { chargeFrequency } = await inquirer.prompt([
            {
                type: 'list',
                name: 'chargeFrequency',
                message: 'Select charge frequency:',
                choices: chargeFrequencyOptions
            }
        ]);

        // Prompt user to enter charge amount
        const { amount } = await inquirer.prompt([
            {
                type: 'input',
                name: 'amount',
                message: 'Enter charge amount:',
                validate: (input) => {
                    // Ensure input is a number and greater than 0
                    if (isNaN(input) || input <= 0) {
                        return 'Please enter a valid positive number for the amount.';
                    }
                    chargeAmount = input; // Store the valid amount
                    return true;
                }
            }
        ]);

        // If all values are provided, proceed with adding the charge
        if (chargeType && chargeFrequency && amount > 0) {
            const payLoad = {
                apiKey: apiKey2,
                businessPhone: phoneNumber,
                merchantId: store.merchantId, // Use merchantId from store object
                chargeName: chargeType,
                frequency: chargeFrequency,
                amount: chargeAmount
            };

            printSection("Add Charge Payload", payLoad);

            const data = await addCharge(payLoad);
            printSection("Add Charge Response", data);
        } else {
            console.log("All options are required.");
        }
    }
}

export async function Credentials() {
    try {
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

        phoneNumber = phoneNo
        // Step 4: Ask if user wants to allow multiple shops
        const { multiShopChoice } = await inquirer.prompt([
            {
                type: 'list',
                name: 'multiShopChoice',
                message: 'Do you want to allow Multiple Shop?',
                choices: allowMultiShopOptions
            }
        ]);
        if (multiShopChoice === "yes") {
            const { numberOfShops } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'numberOfShops',
                    message: 'How many shops would you like to create? (Max 10)',
                    validate: (input) => {
                        const num = parseInt(input, 10);
                        if (isNaN(num) || num <= 1 || num > 10) {
                            return 'Please enter a number between 2 and 10.';
                        }
                        return true;
                    }
                }
            ]);
            numberOfShopsCount = numberOfShops
        }
        // else {
        //     // If only one shop, proceed with the default logic
        //     printSection("Single shop created for ", phoneNumber);
        // }
        printSection("Creating Shop 1...", phoneNumber)
        printSection("Login Payload 1", phoneNumber);
        const generate = await login(phoneNumber);
        printSection("Login Response 1", generate);

        if (generate.OTP === 'ok') {
            printSection("Registered Business Payload 1", phoneNumber);
            const businessData = await isRegisteredBusiness(phoneNumber);
            printSection("Registered Business Response 1", businessData);

            if (businessData.Success.allowMultiFlag === "new") {
                const payLoad = {
                    businessPhone: phoneNumber,
                    token: generate.token,
                    businessName: "",
                    permission: businessData.Success.allowMultiFlag
                };
                printSection("LoginAccountOTP Payload 1", payLoad);
                const loginAccountOTPRes = await loginAccountOTP(payLoad);
                printSection("LoginAccountOTP Response 1", loginAccountOTPRes);

                createdMerchantId = businessData.Success.allowMultiFlag === "new" ? loginAccountOTPRes.merchantId : loginAccountOTPRes.newMerchantId;
                storeNameMerchantId.push({
                    merchantId: createdMerchantId,
                    storeName : ""
                })
                apiKey = loginAccountOTPRes.apiKey;
                
                if(loginAccountOTPRes.verifyFlags.business === "no") {
                    await updateBusinessDetailsFunction(1,1)
                }
                if(loginAccountOTPRes.verifyFlags.user === "no") {
                    await updateUserDetailsFunction(phoneNumber.slice(0, 9), 1, 1)
                }
                if(loginAccountOTPRes.verifyFlags.location === "no") {
                    await updateAddressDetailsFunction(1)
                }
                if(loginAccountOTPRes.verifyFlags.pan === "no" || loginAccountOTPRes.verifyFlags.bank === "no") {
                    await verifyFlagsFunction()
                }
                if(multiShopChoice  === "yes") {
                    await allowMultiFlagFunction()
                }
                await BusinessVPA(createdMerchantId.slice(2), 1)
                // Example usage, passing the shop number
                printShopCreationMessage(1);
                console.log(storeNameMerchantId)
                console.log(storeVpa)
                // printSection("Shop 1 created successfully for 1", phoneNumber);
            }
            else {
                console.log("Response : The AllowMultiFlag is no for 1")
            }

            for (let i = 2; i <= parseInt(numberOfShopsCount, 10); i++) {
                printSection(`Creating Shop ${i}...`, phoneNumber);
                const generate = await login(phoneNumber);
                printSection("Login Response", generate);

                if (generate.OTP === 'ok') {
                    printSection("Registered Business Payload", phoneNumber);
                    const businessData = await isRegisteredBusiness(phoneNumber);
                    printSection("Registered Business Response", businessData);
                    
                    if (businessData.Success.allowMultiFlag === "yes") {
                        const payLoad = {
                            businessPhone: phoneNumber,
                            token: generate.token,
                            businessName: "",
                            permission: businessData.Success.allowMultiFlag
                        };
                        printSection("LoginAccountOTP Payload", payLoad);
                        const loginAccountOTPRes = await loginAccountOTP(payLoad);
                        printSection("LoginAccountOTP Response", loginAccountOTPRes);
                        
                        createdMerchantId = businessData.Success.allowMultiFlag === "new" ? loginAccountOTPRes.merchantId : loginAccountOTPRes.newMerchantId;
                        storeNameMerchantId.push({
                            merchantId: createdMerchantId,
                            storeName : ""
                        })
                        apiKey = loginAccountOTPRes.apiKey;

                        if(loginAccountOTPRes.verifyFlags.business === "no" && createdMerchantId) {
                            await updateBusinessDetailsFunction(i)
                        }
                        if(loginAccountOTPRes.verifyFlags.user === "no" && createdMerchantId) {
                            await updateUserDetailsFunction(phoneNumber.slice(0, 9), i, i)
                        }
                        if(loginAccountOTPRes.verifyFlags.location === "no" && createdMerchantId) {
                            await updateAddressDetailsFunction(i)
                        }
                        if(loginAccountOTPRes.verifyFlags.pan === "no" || loginAccountOTPRes.verifyFlags.bank === "no" && createdMerchantId) {
                            await verifyFlagsFunction()
                        }
                        await BusinessVPA(createdMerchantId.slice(2), i)
                    }
                    else {
                        console.log("Response : The AllowMultiFlag is no ")
                    }
                    // You can replace this with actual API logic for creating shops
                    // printSection(`Shop ${i} created successfully for `, phoneNumber);
                    printShopCreationMessage(i);
                    console.log(storeNameMerchantId)
                    console.log(storeVpa)
                }
            }
        }
        if(storeNameMerchantId.length) {
            addCharges()
        }
        if(storeNameMerchantId.length) {
            // Get today's date
            const today = new Date();

            // Set fromDate to today with current time in UTC
            const fromDate = new Date(today.toISOString());

            // Set toDate to today with 23:59:59.999 in UTC
            const toDate = new Date(today);
            toDate.setHours(23, 59, 59, 999); // Set time to 23:59:59.999
            const toDateIso = new Date(toDate.toISOString());

            console.log("fromDate:", fromDate.toISOString());
            console.log("toDate:", toDateIso.toISOString());
            for (const vpa of storeVpa) {            
                await generateAndSendTransactions(vpa, fromDate, toDate, 15000)
            }

        }
    } 
    catch (error) {
        console.error("❌ An error occurred during the API flow:", error);
    }
    return "✅ Done";
}