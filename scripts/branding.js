const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
let appInfo = require('../app.json');

appInfo.id = uuidv4();

fs.writeFile('app.json', JSON.stringify(appInfo, null, 4), (err) => {
    if (err) throw err;
    console.log('New app id generated\n');
});
