
const debug = require("debug");

module.exports = class CacheArray {
  constructor(items, options = {
    dumpInterval: 60 * 5, // default: 5 minutes
    maxItems: 1000,
    start: true
  }) {
    this.log = debug("app:cachearray");

    this.items = [];
    
    this.options = options;

    if(Array.isArray(items)) {
      items.forEach(el => this.push(el));
    }

    this.intervalId = null;
    if(options.start) this.start();
  }

  splice(...args) {
    return this.items.splice(...args);
  }

  some(func, thisArg) {
    return this.items.some(func, thisArg);
  }

  start() {
    this.intervalId = setInterval(
      this.dump.bind(this),
      this.options.dumpInterval * 1000
    );
  }

  stop() {
    if(this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  push(item) {
    if(this.items.length > this.options.maxItems) {
      // force dump
      this.dump(true);
    }

    // prevent dupes
    if(this.some(e => e.item.url === item.url)) return;

    const modified = {
      date: Date.now(),
      item
    };

    return this.items.push(modified);
  }

  get expired() {
    const diff = this.options.dumpInterval * 1000;
    return this.items.filter(e => {
      return (Date.now() - e.date) > diff;
    })
  }

  get length() {
    return this.items.length;
  }

  dump(force = false) {
    if(force) {
      this.log("forcing dump, probably due to too many items");
    } else {
      this.log(`interval of ${this.options.dumpInterval}s passed, removing expired items`);
    }

    const expired = this.expired;
    const newCache = this.items.filter(item => {
      return (Date.now() - item.date) < this.options.dumpInterval;
    });
    const numRemoved = this.items.length - newCache.length;
    this.items = newCache;
    this.log(`removed ${numRemoved} items`);
  }
};
