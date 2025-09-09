import dotenv from 'dotenv';
import { addCharge, allowMultipleAccount, isPincodeValid, isRegisteredBusiness, login, loginAccountOTP, setBusinessVPA, updateAddressDetails, updateBusinessDetails, updateUserDetails, verifyFlags } from './api.js';

dotenv.config();

const apiKey = process.env.API_KEY;
const apiKey2 = process.env.API_KEY2;

const phoneNumber = "8667223194";
var createdMerchantId = "";

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

      if (businessData.Success && businessData.Success.allowMultiFlag === 'yes') {
        const payLoad = {
          businessPhone: phoneNumber,
          token: generate.token,
          businessName: "",
          permission: "new"
        };
        printSection("LoginAccountOTP Payload", payLoad);

        const res = await loginAccountOTP(payLoad);
        printSection("LoginAccountOTP Response", res);

        createdMerchantId = res.merchantId;
      }

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
        name: "Gokul Business",
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
  } catch (error) {
    console.error("❌ An error occurred during the API flow:", error);
  }

  return "✅ Done";
}

export async function BusinessVPA() {
  const payLoad = {
    businessPhone: phoneNumber,
    bankName: "KVB",
    verifiedType: "offline",
    activatedBy: "marketing",
    uniqueId: "yahvipay.7299700576451@kvb",
    apiKey: apiKey2,
    merchantId: createdMerchantId
  };

  printSection("Set Business VPA Payload", payLoad);

  const data = await setBusinessVPA(payLoad);
  printSection("Set Business VPA Response", data);
}

export async function addCharges() {
  const payLoad = {
    apiKey: apiKey2,
    businessPhone: phoneNumber,
    merchantId: createdMerchantId,
    chargeName: "Device",
    frequency: "monthly",
    amount: "100"
  };

  printSection("Add Charge Payload", payLoad);

  const data = await addCharge(payLoad);
  printSection("Add Charge Response", data);
}
