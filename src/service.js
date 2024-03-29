const config = require("../config.json");
const helper = require("./helper");
const axios = require("axios");
class Manager {
  constructor() {
    this.apiKey = config.apiKey;
    this.apiList = {
      inventAPI: `https://market.csgo.com/api/v2/my-inventory/?key=${this.apiKey}`,
    };
    this.currency = "USD";
  }
  initCode = async () => {
    try {
      await axios.post(`http://103.173.254.162:5000/item/additem`, {
        name: { id64: config.apiKey, platform: "market" },
      });
      await this.loadDatabase();
      await this.loadCurrency();
      this.listInvent();
      setInterval(async () => {
        await this.loadDatabase();
        await this.loadCurrency();
        this.listInvent();
      }, 1000 * 60 * 30);
    } catch (error) {
      console.log(error);
    }
  };

  loadDatabase = async () => {
    try {
      console.log(`Load Database ...`);
      let response = await axios.get(helper.apiList.databaseUrl);
      this.database = response.data.data;
    } catch (error) {
      helper.log(error);
    }
  };
  loadCurrency = async () => {
    try {
      console.log(`Load Currency ...`);
      let response = await axios.get(helper.apiList.currencyUrl);
      if (response?.data?.success !== 200) {
        throw "Error response";
      }
      this.rateUSDT = response.data.data.usdt;
      this.rateCNY = response.data.data.cny;
      this.percentCustom = response.data.data.percentCustom;
    } catch (error) {
      helper.log(error);
    }
  };

  getInvent = () => {
    return new Promise(async (resolve, reject) => {
      try {
        let inventList;
        console.log(`Load invent ...`);
        const response = await axios.get(this.apiList.inventAPI);
        if (response.data.success) {
          inventList = response.data.items;
          resolve(inventList);
        } else {
          reject(false);
        }
      } catch (error) {
        reject(JSON.stringify(error.message) + " error in getInvent()");
      }
    });
  };

  getPrice = (item) => {
    let itemBuff = this.database.find(
      (element) => element.name === item.market_hash_name
    );
    if (!itemBuff) {
      helper.log(`${item.market_hash_name} Không có trong database`);
      return null;
    }
    let priceTemp = itemBuff.priceBuffLatest.priceBuff * this.rateCNY;
    let price =
      (((priceTemp * (this.percentCustom / 100) + priceTemp) /
        (this.rateUSDT * 0.95)) *
        100) /
      95;
    let lastPrice = price.toFixed(2);
    let percentTemp = (lastPrice * 0.95 * 0.95 * this.rateUSDT) / this.rateCNY;
    let gapPercent = percentTemp - itemBuff.priceBuffLatest.priceBuff;
    let percentDep = Number(
      gapPercent / itemBuff.priceBuffLatest.priceBuff
    ).toFixed(2);
    let result = {
      id: item.id || item.item_id,
      name: item.market_hash_name,
      lastPrice,
      updatedAt: itemBuff.updatedAt,
      percentDep: percentDep * 100,
      priceBuff: itemBuff.priceBuffLatest.priceBuff,
    };
    return result;
  };

  listInvent = async () => {
    try {
      const responseInvent = await this.getInvent();
      responseInvent.forEach((element, index) => {
        setTimeout(async () => {
          let getPrice = this.getPrice(element);
          if (getPrice) {
            // console.log(getPrice);
            let price = getPrice.lastPrice * 1000;
            let depUrl = `https://market.csgo.com/api/v2/add-to-sale?key=${this.apiKey}&id=${getPrice.id}&price=${price}&cur=${this.currency}`;
            let response = await axios.get(depUrl);
            if (response.data.success) {
              helper.log(
                `Listed item ${getPrice.name} | ${getPrice.lastPrice}$ | ${getPrice.percentDep}% | ${getPrice.priceBuff}CNY`
              );
            } else {
              helper.log(
                "deposit api" + getPrice + JSON.stringify(response.data)
              );
            }
          }
        }, 1000 * 3 * index);
      });
    } catch (error) {
      console.log(error);
    }
  };
}

module.exports = Manager;
