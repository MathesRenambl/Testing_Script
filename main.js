import {BusinessVPA, Credentials,} from './index.js'

const functionMap={
    Credentials,BusinessVPA
};

const functionName = process.argv[2];

if (!functionName || !functionMap[functionName]) {
  console.error(`Invalid or missing function name: "${functionName}"`);
  console.log(' Available functions:', Object.keys(functionMap).join(', '));
  process.exit(1);
}
console.log(` Running function: ${functionName}`);

try {
  const result = await functionMap[functionName](); 
  console.log('Done:', result);
} catch (err) {
  console.error(`Error in ${functionName}:`, err.message);
}

