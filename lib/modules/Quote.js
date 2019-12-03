
const Module = require("../Module");
const { RichEmbed } = require("discord.js");

module.exports = class QuoteModule extends Module {
  constructor(options) {
    options.name = "quote";
    super(options);
  }

  async setup() {
    this.on("message", async function(message) {
      if(message.author.bot) return;
      if(message.author.id === this.user.id) return;

      const match = /https:\/\/(www\.)?discordapp\.com\/channels\/([0-9]+)\/([0-9]+)\/([0-9]+)/.exec(message.content);

      try {
        if(match) {
          // get message and embed
          const [, , guildid, channelid, messageid] = match;

          const channel = message.guild.channels.get(channelid);
          /**
           * early exit, channel doesn't exist anymore or is not part of this guild
           */
          if(!channel) return;
          const cached = channel.messages.get(messageid);
          const fetched = cached ? cached : await channel.fetchMessage(messageid);

          if(fetched) {
            message.reply(
              new RichEmbed()
                .setTimestamp(fetched.createdAt)
                .setAuthor(fetched.author.tag, fetched.author.displayAvatarURL)
                .setColor("RED")
                .setDescription(fetched.cleanContent)
            )
          } else {
            message.reply("no message matches URL.")
          }
        }
      } catch (err) {
        console.error(err);
      }
    })
  }
}
