
const { Client } = require("discord.js")
const debug = require("debug");

const DatabaseManager = require("./DatabaseManager");
const ModuleManager = require("./ModuleManager")

module.exports = class DiscordClient extends Client {
  constructor(settings = {}, discordJsOptions = {}) {
    super(discordJsOptions);
    this.log = debug("app:client");

    this.moduleManager = new ModuleManager(this);

    this.databaseManager = new DatabaseManager();

    this.settings = settings;

    this.on("ready", () => {
      this.log(`Connected to Discord as ${this.user.tag}, serving ${this.guilds.size} guilds.`);
    });
  }
}