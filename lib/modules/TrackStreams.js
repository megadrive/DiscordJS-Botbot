
const { RichEmbed } = require("discord.js");

const Module = require("../Module")
const CacheArray = require("../CacheArray")

/**
 * Discord.JS Presence.Game.Types
 * See: https://discord.js.org/#/docs/main/stable/class/Game?scrollTo=type
 */
const GameTypes = {
    Playing: 0,
    Streaming: 1,
    Listening: 2,
    Watching: 3
};

/**
 * Ignore these presence updates.
 */
const IgnoredNames = [
  "spotify",
  "custom status"
];

/**
 * Service-specific settings.
 */
const Services = {
  "default": {
    color: [114,137,218] // discord blurple
  },
  twitch: {
    color: [100, 65, 165] // twitch purple
  },
  youtube: {
    color: [255, 0, 0] // youtube red
  },
  facebook: {
    color: [59, 152, 89] // facebook blue
  }
}

/**
 * Tracks when a Discord user streams, and optionally announces to a channel.
 */
module.exports = class TrackStreamsModule extends Module {
  constructor(options = {}) {
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
      if(trigger) {
        if(trigger === "mutemute") {
          this.muted = true;
          message.reply("muted.");
        }
        if(trigger === "unmuteunmute") {
          this.muted = false;
          message.reply("unmuted.");
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
        const announceChannelId = guildSettings && guildSettings[currUser.guild.id] ?
          guildSettings[currUser.guild.id].streamTracker.announceChannelId : null
        ;
        if(!announceChannelId) {
          this.log(`no announceChannelId set for ${currUser.guild.id} in settings.json`);
        } else {
          this.client.channels.get(announceChannelId).send(
            new RichEmbed()
              .setAuthor(currUser.user.username)
              .setColor(this.getServiceColor(curr.name))
              .setDescription(curr.details)
              .setThumbnail(`https://static-cdn.jtvnw.net/ttv-boxart/${encodeURIComponent(curr.state)}-144x192.jpg`)
              .setURL(curr.url)
              .addField("Playing", curr.state)
              .addField("Watch", curr.url)
          );
        }
        
        this.log(say);
        this.cache.push(curr);
      }
    });
  }

  /**
   * Gets service-specific color for Discord embed.
   * @param {string} serviceName The name of the service.
   * @returns {Discord.ColorResolveable}
   */
  getServiceColor(serviceName = "") {
    let color = Services.default.color;
    const service = Services[serviceName.toLowerCase()];
    if(service) {
      color = service.color;
    }
    return color;
  }
}
