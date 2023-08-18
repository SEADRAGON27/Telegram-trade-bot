import "dotenv/config";
import { Scenes } from "telegraf";
import { withdraw } from "../../api.js";
import { extractFromDB, findUserInfo } from "../db.js";
export const withdrawScene = new Scenes.WizardScene(
  "withdraw",
  (ctx) => {
    ctx.reply("✍Write cryptocurrency which do you want withdraw:");
    ctx.wizard.next();
  },
  (ctx) => {
    const currancy = ctx.message.text;
    const symbolRegex = /^[A-Z]{3,}$/;
    if (symbolRegex(currancy)) {
      ctx.scene.state.currancy = currancy;
      ctx.reply(
        "✍Write withdrawal address.\nBe careful, convince that your adress is correct:"
      );
      ctx.wizard.next();
    } else {
      ctx.reply("⛔You must write currancy in this (format:ETH):");
      ctx.wizard.next();
    }
  },
  (ctx) => {
    const withdrawalAddress = ctx.message.text;
    ctx.scene.state.withdrawalAddress = withdrawalAddress;
    ctx.reply("✍Write amount this currancy which you want to withdraw:");
    ctx.wizard.next();
  },
  async (ctx) => {
    const amount = +ctx.message.text;
    if (+amount) {
      ctx.scene.state.amount = amount;
      ctx.wizard.next();
    } else {
      ctx.reply("⛔You must write numbers");
    }
  },
  async (ctx) => {
    const params = ctx.scene.state;
    const data = findUserInfo(ctx.from.id);
    try {
      const res = await extractFromDB("usersKey", data);
      await withdraw(
        res[0].apiSecret,
        res[0].apiKey,
        res[0].passPhrase,
        params
      );
      ctx.reply("✅Operetion is succeed");
      ctx.scene.leave();
    } catch (err) {
      ctx.reply(
        `😓Sorry,something went wrong, make sure that the registration data is written correctly`
      );
      ctx.scene.leave();
    }
  }
);
