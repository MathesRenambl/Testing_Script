import dotenv from 'dotenv';
import { addCharge, allowMultipleAccount, isPincodeValid, isRegisteredBusiness, login, loginAccountOTP, setBusinessVPA, updateAddressDetails, updateBusinessDetails, updateUserDetails, verifyFlags } from './api.js';

dotenv.config();

const apiKey2 = process.env.API_KEY2;

const phoneNumber = "9940413227";
var createdMerchantId = "";
var apiKey = "";

function printSection(title, data) {
    console.log(`\n========== 📌 ${title.toUpperCase()} ==========\n`);
    console.log(JSON.stringify(data, null, 2));
}

export async function Credentials() {
    try {
        console.log("🔐 Starting Login Flow...");
        printSection("Login Payload", phoneNumber);
        const generate = await login(phoneNumber);
        printSection("Login Response", generate);

        if (generate.OTP === 'ok') {
            printSection("Registered Business Payload", phoneNumber);
            const businessData = await isRegisteredBusiness(phoneNumber);
            printSection("Registered Business Response", businessData);

            let res;

            // Check if this is the first time running the script or a new registration
            if (businessData.Success.allowMultiFlag === "new") {
                const payLoad = {
                    businessPhone: phoneNumber,
                    token: generate.token,
                    businessName: "",
                    permission: "new"
                };
                printSection("LoginAccountOTP Payload (New Business)", payLoad);
                res = await loginAccountOTP(payLoad);
                printSection("LoginAccountOTP Response (New Business)", res);
            }
            else if (businessData.Success.allowMultiFlag === "yes") {
                const payLoad = {
                    businessPhone: phoneNumber,
                    token: generate.token,
                    businessName: "", 
                    permission: "yes" 
                };
                printSection("LoginAccountOTP Payload (Existing User, New Business)", payLoad);
                res = await loginAccountOTP(payLoad);
                printSection("LoginAccountOTP Response (Existing User, New Business)", res);

                // Here is the crucial part: if your goal is to log back into the first business,
                // you would need a mechanism to select it. Since you don't have that,
                // you will continue creating new ones. The API might have a parameter for this.
                // For now, this code reflects what's happening.
            }

            if (res && res.merchantId && res.apiKey) {
                createdMerchantId = res.merchantId;
                apiKey = res.apiKey;
                
                // Now proceed with the rest of the flow
                const allowRequired = {
                    businessPhone: phoneNumber,
                    allowMultiLimit: 10
                };
                printSection("Allow Multiple Account Payload", allowRequired);
                const multiAccount = await allowMultipleAccount(allowRequired);
                printSection("Allow Multiple Account Response", multiAccount);
    
                const businessDetailsPayload = {
                    businessPhone: phoneNumber,
                    merchantId: createdMerchantId,
                    name: "Gokul Teashop",
                    category: "Retail & Shopping",
                    subCategory: "Grocery Stores",
                    pincode: "600028",
                    address: "123 Test Street, Chennai",
                    businessType: "FIXED",
                    mccCode: "5411"
                };
                printSection("Update Business Details Payload", businessDetailsPayload);
                const businessUpdate = await updateBusinessDetails(businessDetailsPayload);
                printSection("Update Business Details Response", businessUpdate);
    
                const userDetailsPayload = {
                    phoneNumber: phoneNumber,
                    merchantId: createdMerchantId,
                    name: "Gokul",
                    phone: "9080355312",
                    dob: "2000-01-01",
                    address: "123 Test Street, Chennai"
                };
                printSection("Update User Details Payload", userDetailsPayload);
                const userUpdate = await updateUserDetails(userDetailsPayload);
                printSection("Update User Details Response", userUpdate);
    
                const addressPayload = {
                    address: "123 Street, Chennai",
                    latitude: "12.9716",
                    longitude: "77.5946",
                    apiKey: apiKey,
                    businessPhone: phoneNumber,
                    merchantId: createdMerchantId
                };
                printSection("Update Address Details Payload", addressPayload);
                const addressUpdate = await updateAddressDetails(addressPayload);
                printSection("Update Address Details Response", addressUpdate);
    
                const flagsPayload = {
                    businessPhone: phoneNumber,
                    merchantId: createdMerchantId
                };
                printSection("Verify Flags Payload", flagsPayload);
                const flagsUpdate = await verifyFlags(flagsPayload);
                printSection("Verify Flags Response", flagsUpdate);
            }
        }
    } catch (error) {
        console.error("❌ An error occurred during the API flow:", error);
    }

    return "✅ Done";
}

// export async function BusinessVPA() {
//     // This will now use the latest createdMerchantId
//     const payLoad = {
//         businessPhone: phoneNumber,
//         bankName: "KVB",
//         verifiedType: "offline",
//         activatedBy: "marketing",
//         uniqueId: "yahvipay.7299700576452@kvb",
//         apiKey: apiKey2,
//         merchantId: createdMerchantId
//     };

//     if (createdMerchantId) {
//         printSection("Set Business VPA Payload", payLoad);
//         const data = await setBusinessVPA(payLoad);
//         printSection("Set Business VPA Response", data);
//     } else {
//         console.error("❌ Merchant ID is not set. Cannot run BusinessVPA.");
//     }
// }


export async function addCharges() {
  // This will also use the latest createdMerchantId
    let chargeName="device";
    let frequency = "monthly"
  

    const payLoad = {
        apiKey: apiKey2,
        businessPhone: phoneNumber,
        merchantId: createdMerchantId,
        chargeName:chargeName,
        frequency: frequency,
        amount: "100"
    };

    if (createdMerchantId) {
        printSection("Add Charge Payload", payLoad);
        const data = await addCharge(payLoad);
        printSection("Add Charge Response", data);
    } else {
        console.error("❌ Merchant ID is not set. Cannot run addCharges.");
    }
}