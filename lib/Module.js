
const debug = require("debug");

module.exports = class Module {
  /**
   * @param {ModuleOptions} options Options to apply.
   */
  constructor(options) {
    /** Module options */
    this.options = options;

    /** DiscordJS client */
    this.client = options.client;

    /** Command triggers if necessary. Default: []*/
    this.triggers = options.triggers || [];

    /** Prefix for this module, can be overridden. Default: "!" */
    this.prefix = options.prefix || "!";

    /**
     * @private
     */
    this.eventFunctions = new Map();

    /** Logger namespaced to this module */
    this.log = debug("app:module:" + this.name);
  }

  /** get the module's name */
  get name() { return this.options.name; }

  /**
   * Convenience function to see whether the Module has been triggered by checking the start of a message. Ignores case.
   * @param {string} messageContent The message.content (or cleanContent) to check.
   * @returns boolean
   */
  isTriggered(messageContent) {
    if(!messageContent.startsWith(this.prefix)) return;
    const [trigger, ] = messageContent.slice(1).split(" ");
    if(this.triggers.length === 0 || !trigger) return false;

    return this.triggers.some(t => t.toLowerCase() === trigger.toLowerCase());
  }

  /**
   * Convenience function to see which trigger was triggered.
   * @param {string} messageContent The message.content (or cleanContent) to check.
   * @returns string The trigger or null if none.
   */
  whichTrigger(messageContent) {
    let rv = null;
    if(this.isTriggered(messageContent)) {
      [rv, ] = messageContent.slice(1).split(" ");
    }
    return rv;
  }

  /**
   * Register a module's event to a client event.
   * @param {string} event The Discord event.
   * @param {Function} func The listener function. If passed an arrow function, `this` is referred lexically. If a `function` is passed, `this` is `client`.
   * @returns Module
   */
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

  /**
   * Sets up a module. All modules should override this. Prefer to return a Promise.
   * @abstract
   */
  async setup() {
    throw new Error("Must be overridden in child class.");
  }

  /**
   * Tears down the Module and removes all listeners.
   */
  teardown() {
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
 */
