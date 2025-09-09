import dotenv from 'dotenv';
import { addCharge, allowMultipleAccount, isPincodeValid, isRegisteredBusiness, login, loginAccountOTP, setBusinessVPA, updateAddressDetails, updateBusinessDetails, updateUserDetails, verifyFlags } from './api.js';
dotenv.config();
const apiKey = process.env.API_KEY;
const apiKey2=process.env.API_KEY2;
// import { getAllLeads, getAllUserAccounts, login } from './api.js';
// const data1 = await login({
//                 adminUser: "admin",
//                 password: "Admin@123456"
//             })
//     console.log(data1);

// const data2 = await getAllLeads({
//                 csId: "admin",
// })
//     console.log(data2);

// const data3 = await getAllUserAccounts({
//                 businessPhone: "7299700576"
// })
//     console.log(data3);
const phoneNumber =8667223194;
export async function Credentials () {
    try {
        // const phoneNumber = 8667223194
        const generate = await login(phoneNumber);
        console.log(generate);
        console.log("--------------------------------------------------------------------------------------");
        if (generate.OTP === 'ok') {
            const data = await isRegisteredBusiness(phoneNumber);
            console.log(data);
            console.log("--------------------------------------------------------------------------------------");
            if (data.Success && data.Success.allowMultiFlag === 'yes') {
                const payLoad = {
                    "businessPhone": "8667223194",
                    "token": generate.token,
                    "businessName":"",
                    permission:"new"
                }
                const res = await loginAccountOTP(payLoad);
                console.log(res);
                // const pincode = "600028"
                // if (res.allowRegistration === "TRUE"){
                //     const bPin = await isPincodeValid(pincode);
                //     console.log(bPin); 
                // }
            } 

            const allowRequired = {
                    businessPhone:"8667223194",
                    allowMultiLimit:10,
                }

                const MultipleAccount = await allowMultipleAccount(allowRequired);
                console.log(MultipleAccount);

                const required = {
                    businessPhone: "8667223194",
                    merchantId: "MC1750225933522", 
                    name: "Gokul Business",
                    category: "Retail & Shopping",
                    subCategory: "Grocery Stores",
                    pincode: "600028",
                    address: "123 Test Street, Chennai",
                    businessType: "FIXED",
                    mccCode: "5411"
                };
                const updateBusiness = await updateBusinessDetails(required);
                console.log(updateBusiness);


               

                const userRequired = {
                    phoneNumber:"8667223194",
                    merchantId:"MC1750225933522",
                    name:"Gokul",
                    phone:"9080355312",
                    dob:"2000-01-01",
                    address:"123 Test Street, Chennai"
                }
                const updateUser = await updateUserDetails(userRequired);
                console.log(updateUser);

                const addressRequired = {
                    address:"123 Street, Chennai",
                    latitude:"12.9716",
                    longitude:"77.5946",
                    apiKey:apiKey,
                    businessPhone:"8667223194",
                    merchantId:"MC1750225933522"
                }

                const updateAddress = await updateAddressDetails(addressRequired);
                console.log(updateAddress);

                const flagsRequired = {
                    businessPhone:"8667223194",
                    merchantId:"MC1750225933522"
                }
                const updateFlags = await verifyFlags(flagsRequired);
                console.log(updateFlags);



                 
        }
    } catch (error) {
        console.error("An error occurred during the API flow:", error);
    }

    return "Done"
}






export async function BusinessVPA(){
    const payLoad = {
      businessPhone:"8667223194",
      bankName:"KVB",
      verifiedType:"offline",
      activatedBy:"marketing",
      uniqueId:"yahvipay.7299700576451@kvb",
      apiKey:apiKey2,
      merchantId:"MC1750225933522"
    }

    console.log(payLoad);
    const data = await setBusinessVPA(payLoad);
    console.log(data);
}

export async function addCharges(){
    const merchantId="MC1750225933522";
    const chargeName="Device";
    const frequency="monthly";
    const amount = "100"

    const payLoad = {
        apiKey:apiKey2,
        businessPhone: "8667223194",
        merchantId: merchantId,
        chargeName: chargeName,
        frequency: frequency,
        amount: amount,
    }
    console.log(payLoad)
    const data = await addCharge(payLoad);
    console.log(data);

}















