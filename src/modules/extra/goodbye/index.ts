import { Dispatcher, filters, PropagationAction } from "@mtcute/dispatcher";
import { getChat, prisma } from "@utils/databases";
import { md } from "@mtcute/markdown-parser";
import i18next from "@utils/i18n";
import { InputMedia } from "@mtcute/node";
import { Module } from "@modules/index";
import { replyMissingArgs, replyUnknownArgs } from "@utils/errors";
import { getLang } from "@utils/language";

interface goodbyeState {
  enteringNewGoodbyeMessage: boolean;
  reply_id: number;
}

const dp = Dispatcher.child<goodbyeState>();
const mod = new Module(import.meta.dirname);

dp.onNewMessage(filters.command("goodbye"), async (upd, state) => {
  const lng = await getLang(upd.chat.id);

  /**
   * /goodbye NO ARGS
   * SHOW THE STATE OF THE GOODBYE CMD
   */
  if (!upd.command[1]) {
    const goodbyeState = await getChat(upd.chat.id);
    await upd.replyText(
      md(
        i18next.t("ns1:goodbye.settings", {
          lng: lng,
          enable: goodbyeState?.goodbyeEnabled ? "on" : "off",
          deleteDefault: goodbyeState?.deleteDefaultGoodbye ? "on" : "off",
        }),
      ),
    );
    return;
  }

  /** -------------------------------- /goodbye delete
   */
  if (upd.command[1] == "delete") {
    const usage = md(i18next.t("usage:goodbye.delete_default", { lng: lng }));

    if (!upd.command[2]) {
      await replyMissingArgs(upd, "usage:goodbye.delete_default");
      return;
    }

    if (upd.command[2] != "default") {
      await replyUnknownArgs(upd, "usage:goodbye.delete_default");
      return;
    }

    if (!upd.command[3]) {
      await replyMissingArgs(upd, "usage:goodbye.delete_default");
      return;
    }

    if (!["on", "off"].includes(upd.command[3])) {
      await replyUnknownArgs(upd, "usage:goodbye.delete_default");
      return;
    }

    /**
     * /goodbye delete default <on | off> <redundant arg>
     * THROW TOO MANY ARGS
     */
    if (upd.command[4]) {
      await upd.replyText(
        md`${md(i18next.t("errors:common.too_many_args", { lng: lng }))}\n\n${usage}`,
      );
      return;
    }

    const enableDeleteDefault = upd.command[3] === "on";
    const successMessageKey = enableDeleteDefault
      ? "ns1:goodbye.enable_delete_default"
      : "ns1:goodbye.disable_delete_default";

    await prisma.chat.update({
      where: { id: upd.chat.id },
      data: { deleteDefaultGoodbye: enableDeleteDefault },
    });

    await upd.replyText(md(i18next.t(successMessageKey, { lng: lng })));
    return;
  }

  /* -------------------------------- /goodbye set
   */
  if (upd.command[1] == "set") {
    const usage = md(i18next.t("usage:goodbye.set", { lng: lng }));

    /**
     * /goodbye set NO ARGS
     * SET THE NEW GOODBYE MESSAGE
     */
    if (!upd.command[2]) {
      const reply_id = await upd
        .replyText(md(i18next.t("ns1:goodbye.enter_new", { lng: lng })))
        .then((msg) => msg.id);
      await state.set(
        { enteringNewGoodbyeMessage: true, reply_id: reply_id },
        1800,
      );
      return;
    }

    /**
     * /goodbye set <unknown arg>
     * THROW UNKNOWN ARGS
     */
    if (upd.command[2] != "default") {
      await upd.replyText(
        md`${md(i18next.t("errors:common.unknown_args", { lng: lng }))}\n\n${usage}`,
      );
      return;
    }

    /**
     * /goodbye set default <redundant arg>
     * THROW TOO MANY ARGS
     */
    if (upd.command.length > 3) {
      await upd.replyText(
        md`${md(i18next.t("errors:common.too_many_args", { lng: lng }))}\n\n${usage}`,
      );
      return;
    }

    await prisma.chat.update({
      where: { id: upd.chat.id },
      data: { goodbyeMessageText: null, goodbyeMessageMedia: null },
    });

    await upd.replyText(md(i18next.t("ns1:goodbye.reset", { lng: lng })));
    return;
  }

  /* -------------------------------- /goodbye show
   */
  if (upd.command[1] === "show") {
    const usage = md(i18next.t("usage:goodbye.show", { lng: lng }));

    /**
     * /goodbye show <redundant arg>
     * THROW TOO MANY ARGS
     */
    if (upd.command[2]) {
      await upd.replyText(
        md`${md(i18next.t("errors:common.too_many_args"))}\n\n${usage}`,
      );
      return;
    }

    const goodbyeMessage = await prisma.chat.findUnique({
      where: { id: upd.chat.id },
      select: { goodbyeMessageText: true, goodbyeMessageMedia: true },
    });

    const defaultMessage = md(i18next.t("ns1:goodbye.default", { lng: lng }));

    if (goodbyeMessage?.goodbyeMessageMedia) {
      await upd.replyText(
        md`${md(i18next.t("ns1:goodbye.message_header", { lng: lng }))}`,
      );
      await upd.client.sendMedia(
        upd.chat.id,
        InputMedia.auto(goodbyeMessage.goodbyeMessageMedia, {
          caption: goodbyeMessage.goodbyeMessageText || "",
        }),
      );
    } else {
      await upd.replyText(
        md`${md(i18next.t("ns1:goodbye.message_header", { lng: lng }))}\n\n${goodbyeMessage?.goodbyeMessageText || defaultMessage}`,
      );
    }
    return;
  }

  /* -------------------------------- /goodbye <on | off>
   */
  const usage = md(i18next.t("usage:goodbye.default", { lng: lng }));

  /**
   * /goodbye <unknown arg>
   * THROW UNKNOWN ARGS
   */
  if (!["on", "off"].includes(upd.command[1])) {
    await upd.replyText(
      md`${md(i18next.t("errors:common.unknown_args", { lng: lng }))}\n\n${usage}`,
    );
    return;
  }

  /**
   * /goodbye <on | off> <redundant arg>
   * THROW TOO MANY ARGS
   */
  if (upd.command[2]) {
    await upd.replyText(
      md`${md(i18next.t("errors:common.too_many_args", { lng: lng }))}\n\n${usage}`,
    );
    return;
  }

  const enableGoodbye = upd.command[1] === "on";
  const successMessageKey = enableGoodbye
    ? "ns1:goodbye.enabled"
    : "ns1:goodbye.disabled";
  const errorMessageKey = enableGoodbye
    ? "errors:goodbye.enabling_goodbye_message"
    : "errors:goodbye.disabling_goodbye_message";

  await prisma.chat.update({
    where: { id: upd.chat.id },
    data: { goodbyeEnabled: enableGoodbye },
  });

  await upd.replyText(md(i18next.t(successMessageKey, { lng: lng })));
});

/* -------------------------------- Set new goodbye message handler
 */
dp.onNewMessage(
  filters.and(
    filters.reply,
    filters.state((state) => state.enteringNewGoodbyeMessage),
    filters.or(
      filters.anyVideo,
      filters.anyDocument,
      filters.photo,
      filters.text,
    ),
  ),
  async (upd, state) => {
    if (
      (await upd.getReplyTo().then((msg) => msg?.id)) !=
      (await state.get().then((state) => state?.reply_id))
    ) {
      return;
    }

    const lng: string = await prisma.chat
      .findUnique({
        where: { id: upd.chat.id },
        select: { language: true },
      })
      .then((chat) => chat?.language as string);

    await prisma.chat.update({
      where: { id: upd.chat.id },
      data: {
        goodbyeMessageText: md.unparse(upd.textWithEntities),
        goodbyeMessageMedia: upd.media?.fileId || null,
      },
    });

    await upd.replyText(md(i18next.t("ns1:goodbye.set", { lng: lng })));

    await state.delete();
    return PropagationAction.Stop;
  },
  -1,
);

/* -------------------------------- Bid farewell
 */
dp.onChatMemberUpdate(filters.chatMember("left"), async (upd) => {
  const goodbyeSettings = await prisma.chat.findUnique({
    where: { id: upd.chat.id },
    select: {
      goodbyeEnabled: true,
      goodbyeMessageText: true,
      goodbyeMessageMedia: true,
    },
  });

  if (!goodbyeSettings?.goodbyeEnabled) {
    return;
  }

  const lng: string = await prisma.chat
    .findUnique({
      where: { id: upd.chat.id },
      select: { language: true },
    })
    .then((chat) => chat?.language as string);

  const goodbyeMessageText = (
    goodbyeSettings.goodbyeMessageText ||
    i18next.t("ns1:goodbye.default", { lng: lng })
  )
    .replace(/{user_first}/g, upd.user.firstName)
    .replace(/{user_last}/g, upd.user.lastName!)
    .replace(/{user_full}/g, upd.user.displayName)
    .replace(/{user_id}/g, `${upd.user.id}`)
    .replace(/{username}/g, upd.user.username!)
    .replace(/{user_mention}/g, `@${upd.user.username}`)
    .replace(/{chat_id}/g, `${upd.chat.id}`)
    .replace(/{chat_name}/g, `${upd.chat.displayName}`);

  if (goodbyeSettings.goodbyeMessageMedia) {
    await upd.client.sendMedia(
      upd.chat.id,
      InputMedia.auto(goodbyeSettings.goodbyeMessageMedia, {
        caption: goodbyeMessageText,
      }),
    );
  } else {
    await upd.client.sendText(upd.chat.id, md(goodbyeMessageText));
  }
});

mod.addDispatchers(dp);
export default mod;
