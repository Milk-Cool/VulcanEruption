const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const scan = async () => {
    let list = [];
    let f = await fetch("https://api.mineserv.top/api/search/?type=pc,pc+mod&tags=5&offset=0&limit=50&ordering=rank", {
        "headers": {
            "accept": "*/*"
        },
        "body": null,
        "method": "GET"
    });
    let j = await f.json();
    const count = Math.ceil(j.count / 50);
    console.log(`Scanning mineserv.top: ${count} pages`)
    for(let i = 0; i < count; i++) {
        f = await fetch(`https://api.mineserv.top/api/search/?type=pc,pc+mod&tags=5&offset=${i * 50}&limit=50&ordering=rank`, {
            "headers": {
                "accept": "*/*"
            },
            "body": null,
            "method": "GET"
        });
        j = await f.json();
        for(let k of j.results) {
            k = k.servers[0];
            let server = {};
            server.ip = k.address;
            if(k.port) server.port = k.port;
            console.log(server);
            list.push(server);
        }
    }

    return list;
}

module.exports = scan;