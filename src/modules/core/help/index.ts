import { Dispatcher, filters } from "@mtcute/dispatcher";
import { md } from "@mtcute/markdown-parser";
import { BotKeyboard } from "@mtcute/node";

import { Module } from "@modules/index";
import { prisma } from "@utils/databases";
import i18next from "@utils/i18n";

interface helpState {
  helpMenuID: number;
}

const dp = Dispatcher.child<helpState>();
const mod = new Module(import.meta.dirname);

dp.onNewMessage(filters.command("help"), async (upd, state) => {
  const lng: string = await prisma.chat
    .findUnique({
      where: { id: upd.chat.id },
      select: { language: true },
    })
    .then((chat) => chat?.language as string);

  const usage = md(i18next.t("usage:help.default", { lng: lng }));

  /**
   * /man NO ARGS
   * OPEN HELP MENU
   */
  if (!upd.command[1]) {
    const modules = i18next.getResourceBundle(lng, "usage");
    const markup = BotKeyboard.builder();
    for (const mod in modules) {
      markup.append(
        BotKeyboard.callback(
          `${mod.charAt(0).toUpperCase() + mod.slice(1)}`,
          `help:${mod}`,
        ),
      );
    }
    const helpMenuID = await upd
      .replyText(md(i18next.t("ns1:help.menu", { lng: lng })), {
        replyMarkup: markup.asInline(),
      })
      .then((msg) => msg.id);
    await state.set({ helpMenuID: helpMenuID });
    return;
  }

  /**
   * /man <command> <redundant arg>
   * THROW TOO MANY ARGS
   */
  if (upd.command[2]) {
    await upd.replyText(
      md`${md(i18next.t("errors:common.too_many_args", { lng: lng }))}\n\n${usage}`,
    );
    return;
  }

  /**
   * /man <unknown command>
   * THROW UNKNOWN COMMAND
   */
  if (!i18next.exists(`usage:${upd.command[1]}`)) {
    await upd.replyText(
      md`${md(i18next.t("errors:common.unknown_command", { lng: lng, cmd: upd.command[1] }))}\n\n${usage}`,
    );
    return;
  }

  let text: string = "";
  const commandManual: string[] = Object.values(
    i18next.getResource(lng, "usage", upd.command[1]),
  ) as string[];

  for (const line of commandManual) {
    text = text.concat(line, "\n");
  }

  await upd.replyText(
    md`${md(i18next.t("ns1:help.command_header", { lng: lng, cmd: upd.command[1] }))}\n\n${md(text)}`,
  );
});

dp.onCallbackQuery(
  async (upd, state) =>
    state!.get().then((state) => state?.helpMenuID == upd.messageId),
  async (upd) => {
    const lng: string = await prisma.chat
      .findUnique({
        where: { id: upd.chat.id },
        select: { language: true },
      })
      .then((chat) => chat?.language as string);
    let text: string = "";
    const commandManual: string[] = Object.values(
      i18next.getResource(lng, "usage", upd.dataStr?.split(":")[1]!),
    ) as string[];

    for (const line of commandManual) {
      text = text.concat(line, "\n");
    }

    await upd.editMessage({ text: text });
  },
);

mod.addDispatchers(dp);
export default mod;
