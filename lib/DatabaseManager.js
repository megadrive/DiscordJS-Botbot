
const debug = require("debug");
const Datastore = require("nedb-promises");
const {join} = require("path");

module.exports = class DatabaseManager {
  /**
   * @param {object} options
   * @param {string} options.dataDir Directory where collections will be stored.
   * @param {string[]} options.collections List of collections to load
   */
  constructor(options = {
    dataDir: join(process.cwd(), "data"),
    collections: []
  }) {
    this.options = options;
    this.log = debug("app:dbManager");

    this.log(`Database directory: ${options.dataDir}`)

    /**
     * @type {Map<string, Datastore} MappedCollection
     */
    this.collections = new Map();

    options.collections.forEach(this.open);
  }

  /**
   * Opens a collection.
   * @param {string} name Name of collection to open.
   * @returns {Datastore} The opened collection.
   */
  open(name) {
    if(this.collections.has(name)) {
      return this.get(name);
    }

    const datastore = Datastore.create({
      filename: join(this.options.dataDir, name + ".db")
    });
    this.collections.set(name, datastore);

    datastore.on('__error__', (datastore, event, error, ...args) => {
      this.log(error);
    });

    datastore.on('updateError', (datastore, error, query, update, options) => {
      this.log(error);
    })
    datastore.on('loadError', (datastore, error) => {
      this.log(error);
    })
    datastore.on('ensureIndexError', (datastore, error, options) => {
      this.log(error);
    })

    this.log(`Opened collection ${name}`);

    return datastore;
  }

  /**
   * Gets an opened collection.
   * @param {string} name Name of collection to get.
   * @returns Datastore
   */
  get(name) {
    return this.collections.get(name);
  }

  /**
   * Checks for existance of a collection.
   * @param {string} name Name of collection to check.
   * @returns boolean
   */
  has(name) {
    return this.collections.has(name);
  }
}
