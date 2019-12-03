
const fetch = require("node-fetch")

const Module = require("../Module")

module.exports = class TrackStreamsModule extends Module {
  constructor(options) {
    options.name = "trackstreams";
    super(options);

    this.supported = ["twitch.tv"]; // mixer to come later
    this.triggers = ["trackstream", "untrackstream"];
    this.db = null;
  }

  async onTick(message) {
    const db = client.databaseManager.get(this.name);

    try {
      const guildData = db.find({
        guildid: message.guild.id
      });
    } catch (err) {
      this.log(err);
    }
  }

  /**
   * Handles when a trigger happens
   */
  async handleTriggered(message) {
    const [command, usernameOrUrl, ] = message.content.split(" ");

    const r = /(https?:\/\/(www\.)?(twitch\.tv|mixer\.com)\/)?([a-zA-Z0-9_]{4,25})/;
    const match = r.exec(usernameOrUrl);
    if(match) {
      const [, , , service, username, ] = match;

      if(service && this.supported.some(support => service.toLowerCase() === support)) {
        const userQuery = { guildid: message.guild.id, userid: message.author.id }
        const tableServiceName = service.replace(/[^a-zA-Z]/g, '');
        const userData = await this.db.findOne(userQuery);
        // console.log(userQuery, userData);
        if(userData) {
          console.log("old data:", userData);
          const updated = await this.db.update(userQuery, {
            [tableServiceName]: username
          });
          console.log("updated: ", updated);
        } else {
          const newUserData = userQuery;
          newUserData["$set"] = {[tableServiceName]: username};
          const inserted = await this.db.insert(newUserData);
          console.log("inserting", newUserData);
        }
        process.exit(1);
      } else {
        throw Error(`Service ${service} not supported as yet.`);
      }
    }
  }

  async setup() {
    this.db = this.client.databaseManager.open(this.name);

    // @debug
    this.handleTriggered({
      author: {id: "123386420839710721"},
      content: "!trackstream https://twitch.tv/megadriving",
      guild: {id: "254499434438721536"}
    });
    this.handleTriggered({
      author: {id: "123386420839710721"},
      content: "!trackstream https://www.twitch.tv/tirean",
      guild: {id: "254499434438721536"}
    });
    
    return;

    this.on("message", message => {
      if(this.isTriggered(message.content)) {
        this.handleTriggered(message);
      }
    });
  }
}
