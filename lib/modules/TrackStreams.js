
const fetch = require("node-fetch")

const { RichEmbed } = require("discord.js");

const Module = require("../Module")
const CacheArray = require("../CacheArray")

const GameTypes = {
    Playing: 0,
    Streaming: 1,
    Listening: 2,
    Watching: 3
};

const IgnoredNames = [
  "spotify",
  "custom status"
];

module.exports = class TrackStreamsModule extends Module {
  constructor(options) {
    options.name = "trackstreams";
    super(options);

    this.db = null;

    /** @private */
    this.cache = new CacheArray();

    this.triggers = ["mutemute", "unmuteunmute"];

    /** Whether this module is globally muted. Testing purposes. */
    this.muted = false;
  }

  async setup() {
    this.db = this.client.databaseManager.open(this.name);

    this.client.on("message", message => {
      const trigger = this.whichTrigger(message.content);
      if(trigger.length) {
        if(trigger === "mutemute") {
          this.muted = true;
        }
        if(trigger === "unmuteunmute") {
          this.muted = false;
        }
      }
    });

    this.client.on("presenceUpdate", (oldUser, currUser) => {
      if(this.muted) return;

      const old = oldUser.presence.game;
      const curr = currUser.presence.game;

      if(!old && !curr) {
        return;
      }
      if(curr && curr.game && curr.game.type !== GameTypes.Streaming) {
        return;
      }

      if(curr && IgnoredNames.includes(curr.name.toLowerCase())) {
        return;
      }

      if(
        old && !old.url &&
        curr && curr.url &&
        !this.cache.some(e => e.item.url === curr.url)
      ) {
        const say = `${currUser} has started streaming${curr.state ? (" *" + curr.state + "*") : ""}: "${curr.details}" at ${curr.url}`;

        const guildSettings = this.client.settings.guilds;
        const announceChannelId = guildSettings[currUser.guild.id] ?
          guildSettings[currUser.guild.id].streamTracker.announceChannelId : null
        ;
        if(!announceChannelId) {
          this.log(`no announceChannelId set for ${currUser.guild.id} in settings.json`);
        } else {
          this.client.channels.get(announceChannelId).send(
            new RichEmbed()
              .setAuthor(currUser.user.username)
              .setColor([100,65,165])
              .setDescription(curr.details)
              .setThumbnail(`https://static-cdn.jtvnw.net/ttv-boxart/${encodeURIComponent(curr.state)}-144x192.jpg`)
              .setURL(curr.url)
              .addField("Playing", curr.state, true)
          );
        }
        
        this.log(say);
        this.cache.push(curr);
      }
    });
  }
}
