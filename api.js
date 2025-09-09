import  {usePostFetch} from './usePostFetch.js'
import {useGetFetch} from './useGetFetch.js'

const apiKey = process.env.API_KEY;
// export const login = async (payLoad) => {
//     const data = await usePostFetch("/admin/login", payLoad);
//     return data;
// };

// export const getAllLeads = async (payLoad) => {
//     const data = await usePostFetch("/marketing/getAllLeads", payLoad);
//     return data;
// };

// export const getAllUserAccounts = async (payLoad) => {
//     const data = await usePostFetch("/business/getAllUserAccounts", payLoad);
//     return data;
// };

export const login = async(phoneNumber) => {
    const data = await useGetFetch("/business/generateOTP",{phone:phoneNumber});
    return data;
}

export const isRegisteredBusiness = async(phoneNumber) => {
    const data= await useGetFetch("/business/isPhoneRegistered",{businessPhone:phoneNumber});
    return data;
} 

export const loginAccountOTP = async(payLoad) => {
    const data = await usePostFetch("/business/loginAccountOTP", payLoad);
    return data;
}

export const isPincodeValid = async(pin) => {
    const data = await useGetFetch("/business/isPincodeValid",{pincode:pin});
    return data;
}

export const updateBusinessDetails = async(payLoad) => {
    const { businessPhone, merchantId, ...businessData } = payLoad;
    // console.log(businessData,"businessData")
    // console.log(payLoad,"payLoad data")
    const data = await usePostFetch(
        `/business/updateBusinessDetails?businessPhone=${businessPhone}&apiKey=${apiKey}&type=business&merchantId=${merchantId}`, 
        businessData
    );
   
    return data;
}

export const updateUserDetails = async(payLoad) => {
    const {phoneNumber,merchantId, ...userData } = payLoad;
    const data = await usePostFetch(
        `/business/updateUserDetails?businessPhone=${phoneNumber}&apiKey=${apiKey}&merchantId=${merchantId}`,
        userData
    );

    return data;
}

export const updateAddressDetails = async(payLoad) => {
    const data = await usePostFetch("/business/setLocation",payLoad);
    return data;
}

// export const updatePancard = async(payLoad) => {
//     const data = await usePostFetch("/business/updatePancard",payLoad);
//     return data;
// }

export const verifyFlags = async(payLoad) => {
    const data = await usePostFetch("/setVerifyFlagsTemp",payLoad);
    return data;
}
// export const getAccount

export const setBusinessVPA = async(payLoad) => {
    const data = await usePostFetch("/business/setBusinessVPA", payLoad);
    return data;
}











