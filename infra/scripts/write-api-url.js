const fs = require('fs');

const stackName = process.env.API_STACK_NAME || 'cookinglab-dev-api';
const outputs = JSON.parse(fs.readFileSync('outputs.json', 'utf8'));
const apiUrl = outputs[stackName]?.ApiUrl;

if (!apiUrl) {
  throw new Error('ApiUrl output not found for ' + stackName);
}

fs.appendFileSync(process.env.GITHUB_ENV, 'API_URL=' + apiUrl + '\n');
