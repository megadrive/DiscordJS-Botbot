
require("dotenv").config();
const fetch = require("node-fetch")

const Module = require("../Module")
const weatherApi = `https://api.weatherbit.io/v2.0/current?key=${process.env.WEATHERBIT_TOKEN}`;

module.exports = class WeatherModule extends Module {
  constructor(options) {
    options.name = "weather";
    super(options);

    this.triggers = ["weather"];
  }

  async setup() {
    if(!process.env.WEATHERBIT_TOKEN) {
      throw Error("No WEATHERBIT_TOKEN env var. Not setting up weather module.");
    }

    this.on("message", async (message) => {
      if(message.author.bot) return;
      if(message.author.id === message.client.user.id) return;
      if(!this.isTriggered(message.content)) return;

      // skips !weather and just gets [postcode]
      const [command, postcode, country, ] = message.content.split(" ");

      const isUS = country.toLowerCase() === "us"

      try {
        const res = await fetch(weatherApi +
          "&postal_code=" + postcode +
          "&country=" + country +
          (isUS ? "&units=I" : "")
        );
        const json = await res.json();
        let rv = "";

        if(json.count > 0) {
          const data = json.data[0];
          rv = `currently it is ${data.app_temp}°${isUS ? "F" : "C"} (${data.weather.description}) in ${data.city_name}.`
        } else {
          rv = "no weather info found.";
        }

        message.reply(rv);
      } catch (err) {
        console.error(err);
      }
    })
  }
}
