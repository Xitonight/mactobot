import { Dispatcher, filters, PropagationAction } from "@mtcute/dispatcher";
import { md } from "@mtcute/markdown-parser";
import i18next from "../../../utils/i18n.ts";
import { prisma } from "../../../databases/prisma.ts";
import { BotKeyboard } from "@mtcute/node";

interface settingsState {
  settingsId: number;
}

const dp = Dispatcher.child<settingsState>();

const generateSettingsHomePage = async (lng: string) => {};

dp.onNewMessage(
  filters.and(filters.command("settings"), filters.chat("group")),
  async (upd, state) => {
    const lng: string = await prisma.chat
      .findUnique({
        where: { id: upd.chat.id },
        select: { language: true },
      })
      .then((chat) => chat?.language as string);

    const markup = BotKeyboard.builder()
      .push(
        BotKeyboard.callback(
          i18next.t("settings.buttons.open_here", { lng: lng }),
          "open_here",
        ),
      )
      .push(
        BotKeyboard.callback(
          i18next.t("settings.buttons.open_pm", { lng: lng }),
          "open_pm",
        ),
      )
      .asInline();

    const messageId = await upd
      .replyText(md(i18next.t("settings.where_to_open", { lng: lng })), {
        replyMarkup: markup,
      })
      .then((msg) => msg.id);
    await state.set({ settingsId: messageId });
  },
);

dp.onCallbackQuery(filters.equals("open_here"), async (upd, state) => {
  if ((await state.get().then((state) => state?.settingsId)) != upd.messageId) {
    return;
  }
});

dp.onCallbackQuery(
  filters.equals("open_pm"),
  async (upd, state) => {
    if (
      (await state.get().then((state) => state?.settingsId)) != upd.messageId
    ) {
      return;
    }
    const lng: string = await prisma.chat
      .findUnique({
        where: { id: upd.chat.id },
        select: { language: true },
      })
      .then((chat) => chat?.language as string);
    await upd.client.sendText(
      upd.user.id,
      md(
        i18next.t("settings.home_page", {
          lng: lng,
          chat: `[${upd.chat.displayName}](${await upd.getMessage().then((msg) => msg?.link)})`,
        }),
      ),
    );
    return PropagationAction.Stop;
  },
  -1,
);

export { dp };
