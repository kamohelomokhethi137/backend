node -e "
const fs = require('fs');
const path = './carear-64cbe-firebase-adminsdk-fbsvc-7df697dc3b.json'; 
const raw = fs.readFileSync(path, 'utf8');
const json = JSON.parse(raw);
const escaped = JSON.stringify(json).slice(1, -1); 
console.log('FIREBASE_SERVICE_ACCOUNT=' + escaped);
"