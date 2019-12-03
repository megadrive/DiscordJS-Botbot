
require("dotenv").config();

const { DISCORD_TOKEN } = process.env;
const { join } = require("path");

const Discord = require("./lib/Client");

const bot = new Discord();

bot.addModulesByDirectory(join(__dirname, "lib", "modules"));

bot.login(DISCORD_TOKEN)
  .then(token => bot.log(`ready as ${bot.user.tag}`))
  .catch(console.error)
;
