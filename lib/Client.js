
const { Client } = require("discord.js")
const debug = require("debug");

const DatabaseManager = require("./DatabaseManager");

module.exports = class DiscordClient extends Client {
  constructor(discordJsOptions) {
    super(discordJsOptions);
    this.log = debug("app:client");

    this.modules = new Map();

    this.databaseManager = new DatabaseManager();
  }

  addModule(module) {
    module.setup();
    this.modules.set(module.name, module);
    return this;
  }

  addModulesByClass(moduleClasses, options = {}) {
    const setupModules = moduleClasses.map(moduleClass => {
      const opts = options.client ? options : {client: this};
      const module = new moduleClass(opts);
      this.addModule(module);
      this.log(`Set up ${module.name}`);
    });

    this.log(`Set up ${setupModules.length} modules.`);
    return setupModules;
  }

  addModulesByDirectory(directory = "./modules") {
    const { readdirSync } = require("fs");
    const {join} = require("path");

    const files = readdirSync(directory).filter(filename => !filename.startsWith(".") && filename.endsWith(".js"));

    const modules = files.map(module => {
      return require(join(directory, module));
    });

    return this.addModulesByClass(modules);
  }
}