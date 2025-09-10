import { setBusinessVPA } from "./api.js";

const apiKey = process.env.API_KEY2;
const businesses = [
    {
        businessPhone: "7299700576",
        bankName: "KVB",
        verifiedType: "offline",
        activatedBy: "marketing",
        apiKey: apiKey,
        merchantId: "MC1757503854507"
    },
    
];



function printSection(title, data) {
    console.log(`\n========== 📌 ${title.toUpperCase()} ==========\n`);
    console.log(JSON.stringify(data, null, 2));
}

function getShortEpoch() {
    const epoch = Date.now(); 
    return String(epoch).slice(-3);
}

// Generate payloads with uniqueId
const businessVPAData = businesses.map(business => {
    const shortEpoch = getShortEpoch();
    const uniqueId = `yahvipay.${business.businessPhone}${shortEpoch}@kvb`;
    console.log(uniqueId);
    return {
        businessPhone: business.businessPhone,
        bankName: business.bankName,
        verifiedType: business.verifiedType,
        activatedBy: business.activatedBy,
        uniqueId: uniqueId,
        apiKey:apiKey,
        merchantId: business.merchantId
    };
});

export async function BusinessVPA() {
    const requiredFields = ["businessPhone", "bankName", "verifiedType", "activatedBy", "uniqueId", "apiKey", "merchantId"];
    
    for (const payload of businessVPAData) {
        try {
            
            for (const field of requiredFields) {
                if (!payload[field]) {
                    throw new Error(`Missing or invalid field: ${field}`);
                }
            }
            if (!payload.uniqueId.match(/yahvipay\.\d+@kvb/)) {
                throw new Error(`Invalid uniqueId format for ${payload.businessPhone}`);
            }

            console.log(payload);

            printSection("Set Business VPA Payload", payload);
            const data = await setBusinessVPA(payload);
            printSection("Set Business VPA Response", data);
        } catch (error) {
            console.error(`Error processing VPA for ${payload.businessPhone}:`, error.message);
        }
    }
}
BusinessVPA();

