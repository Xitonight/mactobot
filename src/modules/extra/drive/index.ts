import { Dispatcher, filters } from "@mtcute/dispatcher";
import { md } from "@mtcute/markdown-parser";
import { Module } from "../..";
import { drive } from "#bot/modules/extra/drive/functions.js";

const dp = Dispatcher.child();

dp.onNewMessage(filters.command("gdlist -all"), async (ctx) => {
  const files = await drive.listAll();
  console.log(files);
  if (!files) {
    await ctx.edit({ text: "No files found." });
    return;
  }
  if (files instanceof Error) {
    await ctx.edit({ text: `An error occurred: ${files}` });
    return;
  }
  let text = await drive.formatList(files);

  await ctx.replyText(text);
});

dp.onNewMessage(filters.command("gdlist -nonfolder"), async (ctx) => {
  const files = await drive.listNonFolders();
  console.log(files);
  if (!files) {
    await ctx.edit({ text: "No files found." });
  }
  if (files instanceof Error) {
    await ctx.edit({ text: `An error occurred: ${files}` });
    return;
  }
  let text = await drive.formatList(files);

  await ctx.edit({ text: text });
});

const mod: Module = {
  name: "Google Drive",
  description: "Integrate your very own google drive with your bot!",
  additionalSettings: [],
  additionalSettingsDescription: "",
  commands: ["gdlist"],
  dispatchers: [dp],
  type: "extra",
};

export default mod;
