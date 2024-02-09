import { Scenes, Markup } from "telegraf";
import { pricesCryptoCurrancy } from "../api.js";
import { DB } from "../db.js";

export const wizardSceneNotification = new Scenes.WizardScene(
  "getNotification",
 async (ctx) => {
    await ctx.reply("✍ Write cryptocurrencies name(bitcoin,monero,ripple):");
    ctx.wizard.next();
  },
  async (ctx) => {
    const userPrompt = ctx.message.text;
    const res = await pricesCryptoCurrancy(userPrompt);
    if (+res) {
      ctx.scene.state.cryptocurrancy = userPrompt;
      await ctx.reply("✍ Write Price");
      ctx.wizard.next();
    } else {
      await ctx.reply("⛔Cryptocurrency not found, please re-enter the text");
    }
  },
  async (ctx) => {
    const userPrompt = ctx.message.text;
    if (+userPrompt) {
      ctx.scene.state.price = +userPrompt;
      await ctx.reply('✍ Add comment for notice,\nwrite "no" if you don\'t want');
      ctx.wizard.next();
    } else {
      await ctx.reply("⛔You can write only numbers, please re-enter the text");
    }
  },
 async (ctx) => {
    const userPrompt = ctx.message.text;
    userPrompt != "no" ? (ctx.scene.state.notification = userPrompt) : "";
    ctx.scene.state.userId = ctx.from.id;

   await ctx.reply(
      `🤔Choose how to send the notification`,
      Markup.inlineKeyboard([
        [Markup.button.callback("⚡Telegram", "telegram")],
        [Markup.button.callback("⚡SMS(phone number)", "sms")],
        [Markup.button.callback("⚡SMS and Telegram", "sms/telegram")],
      ])
    );
    ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.callbackQuery.data === "telegram") {
      try {
        ctx.scene.state.telegram = true;
        await recordToDB(ctx.scene.state, "users");
        await ctx.reply("✅the notice is registrated");
        ctx.scene.leave();
      } catch (error) {
        await ctx.reply(`😓Sorry,We have problem in our application.`);
        ctx.scene.leave();
      }
    } else {
      await ctx.reply("✍ Write phone number");
      ctx.scene.state.callbackQuery = ctx.callbackQuery.data;
    }

    ctx.wizard.next();
  },
  async (ctx) => {
    const phoneNumber = ctx.message.text;
    const callbackQuery = ctx.scene.state.callbackQuery;
    const phoneRegex = /^(\+\d{1,3}\s?)?(\d{10})$/;
    phoneRegex.test(phoneNumber)
      ? (ctx.scene.state.phone = phoneNumber)
      : await ctx.reply("⛔Write correct phone number");
    if (callbackQuery == "sms") {
      ctx.scene.state.sms = true;
    } else if (callbackQuery == "sms/telegram") {
      ctx.scene.state.both = true;
    }
    delete ctx.scene.state.callbackQuery;
    try {
      await DB("recordData",ctx.scene.state, "users");
      await ctx.reply("✅the notice is registrated");
      ctx.scene.leave();
    } catch (error) {
     await  ctx.reply("😓Sorry,We have problem in our application.");
      ctx.scene.leave();
    }
  }
);
