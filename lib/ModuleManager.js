
const debug = require("debug");

module.exports = class ModuleManager extends Map {
  constructor(client) {
    super();
    this.log = debug("app:moduleManager");

    this.client = client;
  }
  /**
   * Adds a module by instantiated class.
   * @param {Module} module The module to add.
   * @returns DiscordClient
   */
  add(module) {
    module.setup();
    if(this.has(module.name)) {
      this.log(`already has a module by name of ${module.name}, this will be overwritten.`);
    }
    this.set(module.name, module);
    return this;
  }

  /**
   * Add modules by exported classes
   * @param {Module[]} module classes to add
   * @returns {Module[]} Array of the modules that were successfully added.
   */
  addByClass(moduleClasses) {
    const setupModules = moduleClasses.map(moduleClass => {
      const opts = {client: this.client};
      const module = new moduleClass(opts);
      this.add(module);
      this.log(`Set up ${module.name}`);
      return module;
    });

    this.log(`Set up ${setupModules.length} modules.`);
    return setupModules;
  }

  /**
   * Adds a directory of Module files.
   * @param {string} directory Directory of Module files to add
   * @returns {Module[]} Array of the modules that were successfully added.
   */
  addByDirectory(directory = "./modules") {
    const { readdirSync } = require("fs");
    const { join } = require("path");

    const files = readdirSync(directory).filter(filename => !filename.startsWith(".") && filename.endsWith(".js"));

    const modules = files.map(module => {
      return require(join(directory, module));
    });

    return this.addByClass(modules);
  }
}
