const fs = require('fs');
const readline = require('readline');
var slugify = require('slugify')
const { v4: uuidv4 } = require('uuid');
let appInfo = require('../app.json');

// Generate new random UUID for the App
appInfo.id = uuidv4();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let done = false;

// Asks the user the Apps name, description, author, homepage and support link
rl.question("-> What is the App's name ? ", function(name) {
    rl.question("-> What is the App's description ? ", function(description) {
        rl.question("-> What is the Author's name ? ", function(author) {
            rl.question("-> What is the App's homepage link ? ", function(homepage) {
                rl.question("-> What is the App's support link ? ", function(support) {
                    appInfo.name = name;
                    appInfo.nameSlug = slugify(name, {lower: true});
                    appInfo.description = description;
                    appInfo.author.name = author;
                    appInfo.author.homepage = homepage;
                    appInfo.author.support = support;
                    done = true;
                    rl.close();
                });
            });
        });
    });
});

rl.on("close", function() {

    if (!done) {
        console.log("\n Aborting operation\n");
        process.exit(1);
    }

    fs.writeFileSync('app.json', JSON.stringify(appInfo, null, 4), (err) => {
        if (err) throw err;
    });

    console.log("\n Saved modifications in app.json\n Starting deployment on the Rocket.Chat Marketplace");
    process.exit(0);
});
