import fs from 'fs';
import Papa from 'papaparse'; 

// Configuration
const OUTPUT_CSV_PATH = './Created_PhoneNumbers.csv';
const TARGET_SHOPS = 200;
const CHARGE_AMOUNTS = [100, 150];
const CHARGE_TYPES = ['device', 'device', 'loan'];
const CHARGE_FREQUENCIES = ['daily', 'monthly', 'onetime'];
const TRANSACTION_AMOUNT = 2000;


function generatePhoneNumber(existingNumbers) {
    const prefixes = ['6', '7', '8', '9'];
    let phoneNumber;
    do {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(100000000 + Math.random() * 900000000).toString();
        phoneNumber = prefix + suffix;
    } while (existingNumbers.has(phoneNumber));
    existingNumbers.add(phoneNumber);
    return phoneNumber;
}

function generateNoOfShops(remainingShops, maxShops = 10) {
    // Bias towards 1–5 shops, with occasional larger values
    const distribution = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5, ...Array(maxShops - 5).fill(5).map((_, i) => i + 6)];
    let shops = distribution[Math.floor(Math.random() * distribution.length)];
    // Ensure we don't exceed remaining shops
    return Math.min(shops, remainingShops);
}

// Function to generate test cases
function generateTestCases() {
    const testCases = [];
    const existingNumbers = new Set();
    let totalShops = 0;
    let index = 0;

    while (totalShops < TARGET_SHOPS) {
        const remainingShops = TARGET_SHOPS - totalShops;
        const noOfShops = index < 10 ? generateNoOfShops(remainingShops, 5) : generateNoOfShops(remainingShops, 20);

        if (remainingShops <= 20) {
            testCases.push({
                businessNumber: generatePhoneNumber(existingNumbers),
                noOfShops: remainingShops,
                chargeAmount: CHARGE_AMOUNTS[Math.floor(Math.random() * CHARGE_AMOUNTS.length)],
                chargeType: CHARGE_TYPES[Math.floor(Math.random() * CHARGE_TYPES.length)],
                chargeFrequency: CHARGE_FREQUENCIES[Math.floor(Math.random() * CHARGE_FREQUENCIES.length)],
                transactionAmount: TRANSACTION_AMOUNT
            });
            totalShops += remainingShops;
            break;
        }

        const business = {
            businessNumber: generatePhoneNumber(existingNumbers),
            noOfShops,
            chargeAmount: CHARGE_AMOUNTS[Math.floor(Math.random() * CHARGE_AMOUNTS.length)],
            chargeType: CHARGE_TYPES[Math.floor(Math.random() * CHARGE_TYPES.length)],
            chargeFrequency: CHARGE_FREQUENCIES[Math.floor(Math.random() * CHARGE_FREQUENCIES.length)],
            transactionAmount: TRANSACTION_AMOUNT
        };

        testCases.push(business);
        totalShops += noOfShops;
        index++;
    }

    console.log(`Generated ${testCases.length} businesses with ${totalShops} total shops`);

    // Save to CSV using Papa.unparse
    const csvData = [
        ['businessNumber', 'noOfShops', 'chargeAmount', 'chargeType', 'chargeFrequency', 'transactionAmount'],
        ...testCases.map(b => [
            b.businessNumber,
            b.noOfShops,
            b.chargeAmount,
            b.chargeType,
            b.chargeFrequency,
            b.transactionAmount
        ])
    ];

    const csv = Papa.unparse(csvData);
    fs.writeFileSync(OUTPUT_CSV_PATH, csv, 'utf8');
    console.log(`✅ Test cases saved to ${OUTPUT_CSV_PATH}`);
}

// Run the generation
generateTestCases();