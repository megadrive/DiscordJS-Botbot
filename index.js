
require("dotenv").config();

const { DISCORD_TOKEN, TEST_DISCORD_TOKEN } = process.env;
const { join } = require("path");

const settings = require("./settings.json");
const Discord = require("./lib/Client");

const botbot = new Discord(settings);

botbot.moduleManager.addByDirectory(
  join(process.cwd(), "lib", "modules")
);

botbot.login(DISCORD_TOKEN)
  .then(() => {
    botbot.log(`Guilds: ${botbot.guilds.map(g => g.name).sort().join(", ")}`)
  })
  .catch(console.error)
;
