import { Bot, webhookCallback } from "grammy";
// @ts-ignore
import welcomeMsg from "./welcome.txt";
// @ts-ignore
import rulesMsg from "./rules.txt";


export interface Env {
  BOT_TOKEN: string;
  BOT_INFO: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (!env.BOT_TOKEN) {
      return new Response("BOT_TOKEN is missing", { status: 500 });
    }

    const bot = new Bot(
      env.BOT_TOKEN,
      {botInfo: JSON.parse(env.BOT_INFO)}
    );

    bot.on("message:new_chat_members", async (ctx) => {
      if (ctx.message.new_chat_members?.some((member) => member.is_bot)) {
        return;
      }
      
      await ctx.reply(welcomeMsg, {
        reply_parameters: { message_id: ctx.message.message_id },
        parse_mode: "HTML",
      });
      await ctx.reply(rulesMsg, {parse_mode: "HTML"});
    });

    const handleUpdate = webhookCallback(bot, "cloudflare-mod");
    
    if (request.method === "POST") {
      return handleUpdate(request);
    }
    
    return new Response("Welcome Bot is running!");
  },
};
