import { Bot, webhookCallback, InlineKeyboard } from "grammy";
// @ts-ignore
import welcomeMsg from "./welcome.txt";
// @ts-ignore
import rulesMsg from "./rules.txt";

export interface Env {
  BOT_TOKEN: string;
  BOT_INFO: string;
  SECRET_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (!env.BOT_TOKEN) {
      return new Response("BOT_TOKEN is missing", { status: 500 });
    }

    const bot = new Bot(
      env.BOT_TOKEN,
      { botInfo: JSON.parse(env.BOT_INFO) }
    );

    bot.on("message:new_chat_members", async (ctx) => {
      for (const member of ctx.message.new_chat_members) {
        if (member.is_bot) continue;

        console.log(`New member joined: ${member.first_name} (${member.id})`);

        const keyboard = new InlineKeyboard().text("View Rules", `view_rules:${member.id}`);

        await ctx.reply(welcomeMsg, {
          reply_parameters: { message_id: ctx.message.message_id },
          parse_mode: "HTML",
          reply_markup: keyboard,
        });
      }
    });

    bot.callbackQuery(/^view_rules:(\d+)$/, async (ctx) => {
      const authorizedUserId = parseInt(ctx.match[1], 10);
      const clickingUserId = ctx.from.id;

      if (clickingUserId !== authorizedUserId) {
        await ctx.answerCallbackQuery({
          text: "This message is not for you!",
          show_alert: true,
        });
        return;
      }

      await ctx.reply(rulesMsg, {
        parse_mode: "HTML",
        receiver_user_id: ctx.callbackQuery.from.id,
      });
      await ctx.answerCallbackQuery();
    });

    const handleUpdate = webhookCallback(bot, "cloudflare-mod", {secretToken: env.SECRET_KEY});

    if (request.method === "POST") {
      return handleUpdate(request);
    }

    return new Response("Welcome Bot is running!");
  },
};
