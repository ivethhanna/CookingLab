const fs = require('fs');
const path = require('path');

const stage = process.env.STAGE || 'dev';
const apiStackName = 'cookinglab-' + stage + '-api';
const authStackName = 'cookinglab-' + stage + '-auth';
const outputs = JSON.parse(fs.readFileSync('outputs.json', 'utf8'));
const apiUrl = outputs[apiStackName]?.ApiUrl;
const userPoolId = outputs[authStackName]?.UserPoolId;
const userPoolClientId = outputs[authStackName]?.UserPoolClientId;

if (!apiUrl) {
  throw new Error('ApiUrl output not found for ' + apiStackName);
}

if (!userPoolId) {
  throw new Error('UserPoolId output not found for ' + authStackName);
}

if (!userPoolClientId) {
  throw new Error('UserPoolClientId output not found for ' + authStackName);
}

const envFile = path.join('..', 'frontend', '.env.production');
const contents =
  'VITE_API_URL=' + apiUrl + '\n' +
  'VITE_USER_POOL_ID=' + userPoolId + '\n' +
  'VITE_USER_POOL_CLIENT_ID=' + userPoolClientId + '\n';

fs.writeFileSync(envFile, contents);
