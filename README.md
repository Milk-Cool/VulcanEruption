# VulcanEruption
A vulnerability scanner for (mostly) russian servers that use the Vulcan anticheat

## How to use
First, scan for servers using `npm run scan` or use your own server list.\
Now copy the default config using `cp config.json.template ./config.json` and edit it if needed.\
Then you can start the scanner using `npm run start` to check your servers for the exploit.\
After we're done with that, you can check the output in `out.log` or whatever you specified in the config.