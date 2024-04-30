// This script is not supposed to determine captchas with 100% accuracy.
// If we don't see a captcha, we keep the server.
// If we can't connect to the server, we remove the server from the list.

const mineflayer = require("mineflayer");
const randomstring = require("randomstring");
const fs = require("fs");

const servers = require("./servers.json");
let newServers = [];

const verificationWords = [
    "вериф",
    "код",
    "введите",
    "verif",
    "code",
    "enter"
];

const timeoutSuccessPromise = ms => new Promise(resolve => setTimeout(resolve, ms, new Error("Timeout after " + ms + " ms")));

const checkServer = async server => {
    const ip = server.ip;
    const port = server.port || 25565;
    const version = server.version || false;

    const opts = {
        host: ip,
        port: port,
        version: version
    };
    let bot = mineflayer.createBot(opts);

    let loggedIn = false;
    bot.once("login", () => { loggedIn = true });
    await Promise.race([
        new Promise(resolve => {
            const check = () => {
                if(loggedIn) resolve();
                else setTimeout(check, 1);
            }
            check();
        }),
        timeoutSuccessPromise(2000)
    ]);
    if(!loggedIn) return;

    let done = false, success = true;
    bot.on("chat", msg => {
        msg = msg.toLowerCase();
        for(let i of verificationWords)
            if(msg.includes(i)) {
                done = true;
                success = false;
                return;
            }
    });
    await Promise.race([
        new Promise(resolve => {
            const check = () => {
                if(done) resolve();
                else setTimeout(check, 1);
            }
            check();
        }),
        timeoutSuccessPromise(1500)
    ]);
    await bot.quit();
    console.log(server.ip, success);
    if(success)
        newServers.push(server);
}

(async () => {
    for(let i of servers)
        await checkServer(i).catch(e => null);
    fs.writeFileSync("servers.json", JSON.stringify(newServers, null, 4));
})();