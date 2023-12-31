import "dotenv/config";
import { Scenes, Markup } from "telegraf";
import { openOrder, pricesCryptoCurrancy } from "../../api.js";
import { DB, findUserInfo } from "../db.js";
export const ordersScene = new Scenes.WizardScene(
  "openOrder",
  async (ctx) => {
    await ctx.reply(
      "🤔Select type of trading",
      Markup.inlineKeyboard([
        [Markup.button.callback("⚡Margin", "mar")],
        [Markup.button.callback("⚡Spot", "spt")],
      ])
    );
    ctx.wizard.next();
  },
  async (ctx) => {
    const userPromt = ctx.message;
    if (userPromt) {
      await ctx.reply("⛔ Please use the buttons to make a selection.");
    } else {
      switch (ctx.callbackQuery.data) {
        case "spt":
          ctx.scene.state.button = "orders";
          break;
        case "mat":
          ctx.scene.state.button = "margin/order";
          break;
      }
      await ctx.reply(" 🧠 Come up with clientOid(max 40 symbols)");
      ctx.wizard.next();
    }
  },
  async (ctx) => {
    const clientOid = ctx.message.text;
    if (clientOid.length > 40) {
      await ctx.reply("✍ You can write max 40 symbols: ");
    } else {
      ctx.scene.state.clientOid = clientOid;
      await ctx.reply("😲 Do you want 'buy' or 'sell'?");
      ctx.wizard.next();
    }
  },
  async (ctx) => {
    const kindOrder = ctx.message.text;
    if (kindOrder == "buy" || kindOrder == "sell") {
      ctx.scene.state.kindOrder = kindOrder;
      await ctx.reply("✍ Write cryptocurrencies name(bitcoin,monero,ripple)");
      ctx.wizard.next();
    } else {
     await ctx.reply("⛔ You must write 'buy' or 'sell':");
    }
  },
  async (ctx) => {
    const cryptoCurrancy = ctx.message.text;
    const res = await pricesCryptoCurrancy(cryptoCurrancy);
    if (+res) {
      ctx.scene.state.cryptoCurrancy = cryptoCurrancy;
     await ctx.reply("✍ Write trading pair(format:ETH-USDT):");
      ctx.wizard.next();
    } else {
     await ctx.reply("⛔Cryptocurrency not found, please re-enter the text");
    }
  },
  async (ctx) => {
    const symbolRegex = /^[A-Z]{3,}-[A-Z]{3,}$/;
    const tradingPair = ctx.message.text;
    if (symbolRegex.test(tradingPair)) {
      ctx.scene.state.tradePair = tradingPair;
      await ctx.reply("✍ Choose type of trading'limit' or 'market':");
      ctx.wizard.next();
    } else {
      await ctx.reply("⛔ You must write correct trading pairs");
    }
  },
 async (ctx) => {
    const typeOfTrading = ctx.message.text;
    if (typeOfTrading == "limit") {
      ctx.scene.state.typeOfTrading = typeOfTrading;
      await ctx.reply("✍ Set the trigger price of the order in USDT");
      ctx.wizard.next();
    } else if (typeOfTrading == "market") {
      ctx.scene.state.typeOfTrading = typeOfTrading;
     await ctx.reply("✍ Write size position in USDT");
      ctx.wizard.selectStep(8);
    } else {
      await ctx.reply(" ⛔You must write words 'limit' or 'market'");
    }
  },
  async (ctx) => {
    const price = ctx.message.text;
    const regex = /^[0-9]+$/;
    if (regex.test(price)) {
      ctx.scene.state.price = price;
      await ctx.reply("✍ Write size position in USDT.");
      ctx.wizard.next();
    } else {
      await ctx.reply("⛔You must write numbers");
    }
  },
  async (ctx) => {
    const size = ctx.message.text;
    const regex = /^[0-9]+$/;
    if (regex.test(size)) {
      ctx.scene.state.size = size;
      const params = ctx.scene.state;
      const apiText = ctx.scene.state.button;
      const data = findUserInfo(ctx.from.id);

      try {
        const res = await DB("getData", data,"usersKey");
        await openOrder(
          res[0].apiSecret,
          res[0].apiKey,
          res[0].passPhrase,
          params,
          apiText
        );
        await ctx.reply("✅Order is registrated!");
        ctx.scene.leave();
      } catch (err) {
        await ctx.reply(
          `😓Something went wrong make sure the data is written correctly during registration and API permissions`
        );
        ctx.scene.leave();
      }
    } else {
      await ctx.reply("✍ You must write numbers in USDT");
    }
  }
);
