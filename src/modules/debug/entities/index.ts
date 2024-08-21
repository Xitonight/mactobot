import { Dispatcher, filters } from "@mtcute/dispatcher";
import { md } from "@mtcute/markdown-parser";
import { Module } from "#bot/modules/index.js";

const dp = Dispatcher.child();

dp.onNewMessage(filters.command("entities"), async (ctx) => {
  if (ctx.replyToMessage) {
    const text =
      "Entities: " +
      JSON.stringify((await ctx.getReplyTo())?.entities, null, 2);
    await ctx.replyText(text);
    return;
  }
  const text = "Entities: " + JSON.stringify(ctx.entities, null, 2);
  await ctx.replyText(text);
});

const mod: Module = {
  name: "Entities",
  description: "List entities in the message",
  additionalSettings: [],
  additionalSettingsDescription: "",
  commands: [],
  dispatchers: [dp],
  type: "debug",
};

export default mod;
