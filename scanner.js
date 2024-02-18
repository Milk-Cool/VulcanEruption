const fs = require("fs");

// Scanners
const minecraftrating = require("./scanners/minecraftrating.js");
const minehut = require("./scanners/minehut.js");

let list = [];

(async () => {
    for(let scanner of [
        minecraftrating,
        minehut,
    ]) {
        for(let j of await scanner()) {
            list.push(j);
        }
    }
    fs.writeFileSync("servers.json", JSON.stringify(list, null, 4));
    console.log("All done!");
})();