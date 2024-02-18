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
    console.log("Excluding repeated servers...");
    list = list.filter((v, i) => list.findIndex(t => (t.ip === v.ip && t.port === v.port)) === i);
    fs.writeFileSync("servers.json", JSON.stringify(list, null, 4));
    console.log("All done!");
})();