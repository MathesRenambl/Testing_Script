const globalAmount = 10000;
const fromDate = new Date("2025-09-08T00:00:00Z");
const toDate = new Date("2025-09-10T23:59:59Z");

const fixedData = {
  apiKey: "M2hZZytlZU1vL3h0aWR2TXVoOUFhdTV1RmNRaWVnaGYxZ0Vpb0hBVmFKbz",
  Payeraddr: "chiyan@ybl",
  PayerName: "Rahul Sharma",
};

const endpoint = "http://192.168.1.38:65235/temp/initiateTransaction"; 

// Helper to generate a random date between two dates
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

// Helper to generate random integer in range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to generate dummy VPA
function generateVPA() {
  const random = Math.floor(Math.random() * 1000000000);
  return `yahvipay.${random}@kvb`;
}

// Helper to generate dummy reference IDs
function generateMerchantRefId(prefix = "REF") {
  return `${prefix}${Math.floor(Math.random() * 1000000000)}`;
}

function generateRRN() {
  return `${Math.floor(Math.random() * 100000000000)}`;
}

function generateUpiTransID() {
  return `${Math.floor(Math.random() * 1000000000)}`;
}
// Function to split amount into random parts summing to total
function splitAmount(totalAmount) {
  const splits = [];
  let remaining = totalAmount;

  while (remaining > 0) {
    const next = Math.min(randomInt(500, 3000), remaining); // each split 500–3000
    splits.push(next);
    remaining -= next;
  }

  return splits;
}

// Main function
async function generateAndSendTransactions() {
  const amounts = splitAmount(globalAmount);
  const payloads = [];

  for (let amount of amounts) {
    const data = {
      KVBData: {
        ...fixedData,
        Amount: amount.toString(),
        PayeeAddr: generateVPA(),
        MerchantRefID: generateMerchantRefId("REF"),
        TransDate: randomDate(fromDate, toDate),
        RRN: generateRRN(),
        UpiTransID: generateUpiTransID(),
      },
    };

    payloads.push(data);
  }

  console.log(payloads);
  console.log(`✅ Generated ${payloads.length} payloads.`);

  // Send them one by one
  for (let i = 0; i < payloads.length; i++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payloads[i]),
    });
      console.log(`✅ Sent payload ${i + 1}/${payloads.length}:`, response.status);
    } catch (error) {
      console.error(`❌ Error sending payload ${i + 1}:`, error.message);
    }
  }
}

// Run the script
generateAndSendTransactions();
