
const debug = require("debug");

module.exports = class Module {
  /**
   * @param {ModuleOptions} options Options to apply.
   */
  constructor(options) {
    this.options = options;
    this.client = options.client;
    this.triggers = options.triggers || [];
    this.prefix = options.prefix || "!";
    this.help = options.help || "";

    this.eventFunctions = new Map();

    this.log = debug("app:module:" + this.name);
  }

  get name() { return this.options.name; }

  /**
   * Convenience function to see whether the Module has been triggered by checking the start of a message. Ignores case.
   * @param {string} messageContent The message.content (or cleanContent) to check.
   * @returns boolean
   */
  isTriggered(messageContent) {
    const [trigger, ] = messageContent.split(" ");
    if(this.triggers.length === 0 || !trigger) return false;

    return this.triggers.some(t => t.toLowerCase() === this.prefix + trigger.toLowerCase());
  }

  on(event, func) {
    let eventFunctions = this.eventFunctions.get(event);
    if(!eventFunctions) {
      eventFunctions = [];
    }

    const bound = func.bind(this.client);
    eventFunctions.push(bound);
    this.client.on(event, bound);

    this.eventFunctions.set(event, eventFunctions);
    return this;
  }

  async setup() {
    throw new Error("Must be overridden in child class.");
  }

  async teardown() {
    if(this.eventFunctions.size) {
      this.eventFunctions.forEach((listeners, event) => {
        listeners.forEach(listener => {
          this.client.removeListener(event, listener);
        })
      });
    }
  }
}

/**
 * @typedef {object} ModuleOptions
 * @property {string} name The internal name of the module
 * @property {Discord.Client} client Instance of DiscordJS client
 * @property {string[]} triggers Triggers that this module uses: excluding prefix. Default: []
 * @property {string} prefix Prefix. Default: "!"
 * @property {string} help Helptext. Default: ""
 */
