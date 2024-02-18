const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const BASE_URL = "https://minecraftrating.ru/servera-bez-launchera/";

const scan = async () => {
    let list = [];
    let f = await fetch(BASE_URL);
    let t = await f.text();
    let dom = new JSDOM(t, {
        "contentType": "text/html"
    });
    const pages = parseInt(dom.window.document.querySelector("body > div.wrapper-main > div.container.container-main > ul > li:nth-last-child(2)").textContent);
    console.log(`Scanning minecraftrating.ru: ${pages} pages`);

    for(let i = 1; i <= pages; i++) {
        console.log(`Page ${i}`);
        f = await fetch(BASE_URL + "page/" + i.toString());
        t = await f.text();
        dom = new JSDOM(t, {
            "contentType": "text/html"
        });
        const table = dom.window.document.querySelector("table > tbody");
        for(let j of Array.from(table.children)) {
            const ver = j.querySelector(".block:nth-child(5) > .block-i > a")?.textContent;
            if(!ver || ver.startsWith("PE")) continue;
            const ip = j.querySelector(".block.ip > .block-i")?.children?.[0]?.children?.[0]?.textContent;
            if(!ip) continue;
            console.log(ip);
            let server = {};
            server.ip = ip.split(":")[0];
            if(ip.includes(":")) server.port = ip.split(":")[1];
            server.version = ver;
            list.push(server);
            console.log(server);
        }
    }

    return list;
}

module.exports = scan;