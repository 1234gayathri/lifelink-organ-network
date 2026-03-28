const https = require('https');

const data = JSON.stringify({
  hospitalId: 'rakotisaigayathri@gmail.com', // Actually, the ID in DB is string
  officialEmail: 'rakotisaigayathri@gmail.com',
  password: 'wrong_password'
});

const options = {
  hostname: 'lifelink-organ-network.onrender.com',
  port: 443,
  path: '/api/auth/hospital/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log('statusCode:', res.statusCode);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error('ERROR:', error);
});

req.write(data);
req.end();
