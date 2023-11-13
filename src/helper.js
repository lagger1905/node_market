const dateFormat = require("dateformat");
const util = require("util");
const config = require("../config.json");
const API_KEY = config.apiKey;
module.exports = {
  apiList: {
    databaseUrl: "http://103.173.254.162:5000/item/api/buff/items",
    currencyUrl: "http://103.173.254.162:3000/get-currency",
    inventUrl: `https://market.csgo.com/api/v2/my-inventory/?key=${API_KEY}`,
  },
  discordChannel: "market-p2p",
  statusMessage: {
    fail: "Failed",
  },
  log(d, color = "\x1b[0m") {
    console.log(
      color +
        "[" +
        dateFormat(new Date(), "yyyy-mm-dd H:MM:ss.l") +
        "] " +
        util.format(d),
      "\x1b[37m"
    );
  },
  async wait(mli) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        return resolve();
      }, mli * 1000);
    });
  },
};
