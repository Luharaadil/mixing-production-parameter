const https = require('https');

https.get('https://script.google.com/macros/s/AKfycbxEVrBCNinBpAM1pUMsn43rhGT_JaJAIY3CSnJI5mJX51ab_cSihT5BnFxZ2Zfx1VFGQw/exec', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  if (res.statusCode === 302) {
    console.log('Redirecting to:', res.headers.location);
    https.get(res.headers.location, (res2) => {
      console.log('Redirect Status Code:', res2.statusCode);
      console.log('Redirect Headers:', res2.headers);
      let data = '';
      res2.on('data', (chunk) => {
        data += chunk;
        if (data.length > 1000) {
          console.log('First 1000 bytes:', data.substring(0, 1000));
          process.exit(0);
        }
      });
    });
  }
}).on('error', (e) => {
  console.error(e);
});
