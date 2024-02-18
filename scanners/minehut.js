const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const BASE_URL = "https://minehut.com/sl/best-cracked-minecraft-servers";

const scan = async () => {
    let list = [];
    let f = await fetch(BASE_URL);
    let t = await f.text();
    let dom = new JSDOM(t, {
        "contentType": "text/html"
    });
    const pages = parseInt(dom.window.document.querySelector("#layout > div > main > div > div.ant-card.ant-card-bordered.css-lzncpa > div > div > div:nth-child(15) > ul > li:nth-last-child(2)").textContent);
    console.log(`Scanning minehut.com: ${pages} pages`);

    for(let i = 1; i <= pages; i++) {
        console.log(`Page ${i}`);
        f = await fetch("https://serverlist-api.minehut.com/api/v1/servers/list", {
            "headers": {
                "accept": "*/*"
            },
            "body": JSON.stringify({
                "keywords": "",
                "page": i,
                "page_size": 10,
                "sort": "votes",
                "tags": [ "cracked" ]
            }),//"{\"keywords\":\"\",\"page\":1,\"page_size\":10,\"sort\":\"votes\",\"tags\":[\"cracked\"]}",
            "method": "POST"
        });
        const j = await f.json();
        for(let k of j.servers) {
            if(!k.java_ip) continue;
            let ver;
            /// Cannot convert minehut version to mineflayer version
            // if(k.version) {
            //     if(k.version.includes("-"))
            //         ver = k.version.slice(k.version.indexOf(" ") + 1, k.version.indexOf("-"));
            //     else
            //         ver = k.version.slice(k.version.indexOf(" ") + 1);
            // }
            const ip = k.java_ip;
            let server = {};
            server.ip = ip.split(":")[0];
            if(ip.includes(":")) server.port = ip.split(":")[1];
            // if(ver) server.version = ver;
            list.push(server);
            console.log(server);
        }
    }

    return list;
}

module.exports = scan;