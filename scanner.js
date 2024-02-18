const fs = require("fs");

// Scanners
const minecraftrating = require("./scanners/minecraftrating.js");
const minehut = require("./scanners/minehut.js");
const mineserv = require("./scanners/mineserv.js");

let list = [];

(async () => {
    for(let scanner of [
        minecraftrating,
        minehut,
        mineserv,
    ]) {
        for(let j of await scanner()) {
            list.push(j);
        }
    }
    fs.writeFileSync("servers.json", JSON.stringify(list, null, 4));
    console.log("All done!");
})();