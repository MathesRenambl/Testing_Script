import inquirer from 'inquirer';
import { addCharge } from "./api.js";

const addedCharges = [];

export async function addCharges() {
  const questions = [
    {
      type: 'input',
      name: 'chargeName',
      message: 'Enter the charge name:'
    },
    {
      type: 'input',
      name: 'frequency',
      message: 'Enter the frequency (e.g., monthly):'
    },
    {
      type: 'input',
      name: 'amount',
      message: 'Enter the amount:'
    }
  ];

  const answers = await inquirer.prompt(questions);
  const { chargeName, frequency, amount } = answers;

  const apiKey = process.env.API_KEY;
  const phoneNumber = "8925046655";
  const createdMerchantId = "MC1757484463557";

  const normalizedInputName = chargeName.trim().toLowerCase();

  const existingCharge = addedCharges.find(
    (charge) => charge.chargeName === normalizedInputName && charge.merchantId === createdMerchantId
  );

  if (existingCharge) {
    console.warn(`⚠️ A charge named "${chargeName}" already exists for this merchant. Skipping.`);
    return;
  }

  const payLoad = {
    apiKey: apiKey,
    businessPhone: phoneNumber,
    merchantId: createdMerchantId,
    chargeName: chargeName.trim(),
    frequency: frequency,
    amount: amount
  };

  if (createdMerchantId) {
    console.log("Add Charge Payload:", payLoad);

    addedCharges.push({
      chargeName: normalizedInputName,
      merchantId: createdMerchantId
    });

    const data = await addCharge(payLoad);
    console.log("Add Charge Response:", data);
  } else {
    console.error("❌ Merchant ID is not set. Cannot run addCharges.");
  }

  console.log("Current Charges:", addedCharges);
}

async function runMultipleCharges(times = 100) {
  for (let i = 0; i < times; i++) {
    console.log(`\n=== Charge Entry #${i + 1} ===`);
    await addCharges();
  }
}

runMultipleCharges();
