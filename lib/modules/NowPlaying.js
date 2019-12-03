
const fetch = require("node-fetch")

const Module = require("../Module")

module.exports = class NowPlayingModule extends Module {
  constructor(options) {
    options.name = "nowplaying";
    super(options);

    this.db = null;

    this.triggers = ["np", "nowplaying"];
  }

  static async getCurrentTrack(username) {
    const url = "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&api_key={}&format=json&user=".replace("{}", process.env.LASTFM_TOKEN) + username;

    const res = await fetch(url);
    const json = await res.json();

    if(json.error) {
      this.log(`Error #${json.error}: ${json.message}`);
      throw new Error(json.message);
    }

    const first = json.recenttracks.track[0];
    if(first["@attr"] && first["@attr"].nowplaying) {
      return {
        artist: first.artist["#text"],
        track: first.name,
        album: first.album["#text"],
        art: first.image.map(data => {
          return {
            [data.size]: data["#text"]
          }
        })
      };
    } else {
      return null;
    }
  }

  async setup() {
    this.db = this.client.databaseManager.open(this.name);

    this.on("message", async (message) => {
      if(message.author.bot) return;
      if(message.author.id === message.client.user.id) return;
      if(!this.isTriggered(message.content)) return;

      const [command, username] = message.content.split(" ");

      const db = this.client.databaseManager.get("nowplaying");

      try {
        const searchQuery = {discordId: message.author.id};
        const storedUsername = await db.findOne(searchQuery);

        if(!storedUsername && !username) {
          return message.reply("Supply a Last.fm username.");
        }

        if(username) {
          if(storedUsername) {
            db.update(searchQuery, {
              "$set": {
                lastFmUsername: username
              }
            });
          } else {
            db.insert({
              discordId: message.author.id,
              lastFmUsername: username
            });
          }
        }

        const current = await NowPlayingModule.getCurrentTrack(username || storedUsername.lastFmUsername);
        let reply = "nothing playing.";
        if(current) {
          const { artist, track } = current;
          reply = `${track} by ${artist} is currently playing.`;
        }

        message.reply(reply);
      } catch (err) {
        console.error(err);
      }
    })
  }
}
