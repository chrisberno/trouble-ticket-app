const https = require('https');

const authToken = '4819c4f3cbfc1c7a021a24fca6847938';
const basePattern = 'AC6f01';
const endPattern = 'c4a';

// Generate potential Account SIDs based on the pattern AC6f01...c4a
const generatePotentialSids = () => {
  const sids = [];
  // Common patterns for the middle part
  const middleParts = [
    'b9c73d4a4c4b8f8f8e8d8c8b8', // 25 chars to make total 34
    'b9c73d4a4c4b8f8f8e8d8c8b9', 
    'b9c73d4a4c4b8f8f8e8d8c8ba',
    'b9c73d4a4c4b8f8f8e8d8c8bb',
    'b9c73d4a4c4b8f8f8e8d8c8bc',
    'b9c73d4a4c4b8f8f8e8d8c8bd',
    'b9c73d4a4c4b8f8f8e8d8c8be',
    'b9c73d4a4c4b8f8f8e8d8c8bf'
  ];
  
  middleParts.forEach(middle => {
    sids.push(basePattern + middle + endPattern);
  });
  
  return sids;
};

const testAccountSid = (accountSid) => {
  return new Promise((resolve) => {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${accountSid}.json`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✓ Found valid Account SID: ${accountSid}`);
          console.log('Account details:', JSON.parse(data));
          resolve(accountSid);
        } else {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.end();
  });
};

const findValidAccount = async () => {
  const potentialSids = generatePotentialSids();
  
  console.log('Testing potential Account SIDs...');
  
  for (const sid of potentialSids) {
    console.log(`Testing: ${sid}`);
    const result = await testAccountSid(sid);
    if (result) {
      return result;
    }
  }
  
  console.log('No valid Account SID found with the given pattern.');
  return null;
};

findValidAccount().then(validSid => {
  if (validSid) {
    console.log(`\nUse this Account SID: ${validSid}`);
  }
});