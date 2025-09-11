import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { addCharge, getAllUserAccounts, } from './api.js';
dotenv.config();

const chargeTypeOptions = ["device", "loan"]
const chargeFrequencyOptions = ["daily", "monthly", "onetime"]
var chargeAmount;
var storeNameMerchantId = [];
const apiKey2 = process.env.API_KEY2;
var phoneNumber = "8839868555";

function printSection(title, data) {
    console.log(`\n========== 📌 ${title.toUpperCase()} ==========\n`);
    console.log(JSON.stringify(data, null, 2));
}

export async function addCharges() {

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
            for (const store of storeNameMerchantId) {
        
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
                } 
                else {
                    console.log("All options are required.");
                }
            }
        }
        else {
            console.log("Error : ", phoneByMerchant.Error)
        }
    }
}
addCharges()