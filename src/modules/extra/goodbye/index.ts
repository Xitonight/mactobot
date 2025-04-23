import { Dispatcher, filters, PropagationAction } from "@mtcute/dispatcher";
import { prisma } from "@utils/databases";
import { md } from "@mtcute/markdown-parser";
import i18next from "@utils/i18n";
import { InputMedia } from "@mtcute/node";
import { Module } from "@modules/.";

interface goodbyeState {
  enteringNewGoodbyeMessage: boolean;
  reply_id: number;
}

const dp = Dispatcher.child<goodbyeState>();
const mod = new Module("goodbye", "module");

/* -------------------------------- /goodbye handler
 */
dp.onNewMessage(filters.command("goodbye"), async (upd, state) => {
  const lng: string = await prisma.chat
    .findUnique({
      where: { id: upd.chat.id },
      select: { language: true },
    })
    .then((chat) => chat?.language as string);

  /**
   * /goodbye NO ARGS
   * SHOW THE STATE OF THE GOODBYE CMD
   */
  if (!upd.command[1]) {
    const goodbyeState = await prisma.chat.findUnique({
      where: { id: upd.chat.id },
      select: {
        goodbyeEnabled: true,
        deleteDefaultGoodbye: true,
      },
    });
    await upd.replyText(
      md(
        i18next.t("goodbye.settings", {
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

    /**
     * /goodbye delete NO ARGS
     * THROW MISSING ARGS
     */
    if (!upd.command[2]) {
      await upd.replyText(
        md`${md(i18next.t("errors:common.missing_args", { lng: lng }))}\n\n${usage}`,
      );
      return;
    }

    /**
     * /goodbye delete <unknown arg>
     * THROW UNKNOWN ARGS
     */
    if (upd.command[2] != "default") {
      await upd.replyText(
        md`${md(i18next.t("errors:common.unknown_args", { lng: lng }))}\n\n${usage}`,
      );
      return;
    }

    /**
     * /goodbye delete default NO ARGS
     * THROW MISSING ARGS
     */
    if (!upd.command[3]) {
      await upd.replyText(
        md`${md(i18next.t("errors:common.missing_args", { lng: lng }))}\n\n${usage}`,
      );
      return;
    }

    /**
     * /goodbye delete default <unknown arg>
     * THROW UNKNOWN ARGS
     */
    if (!["on", "off"].includes(upd.command[3])) {
      await upd.replyText(
        md`${md(i18next.t("errors:common.unknown_args", { lng: lng }))}\n\n${usage}`,
      );
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
      ? "goodbye.enable_delete_default"
      : "goodbye.disable_delete_default";
    const errorMessageKey = enableDeleteDefault
      ? "errors:goodbye.enabling_delete_default"
      : "errors:goodbye.disabling_delete_default";

    try {
      await prisma.chat.update({
        where: { id: upd.chat.id },
        data: { deleteDefaultGoodbye: enableDeleteDefault },
      });

      await upd.replyText(md(i18next.t(successMessageKey, { lng: lng })));
    } catch (err) {
      await upd.replyText(md(i18next.t(errorMessageKey, { lng: lng })));
    }
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
        .replyText(md(i18next.t("goodbye.enter_new", { lng: lng })))
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

    try {
      await prisma.chat.update({
        where: { id: upd.chat.id },
        data: { goodbyeMessageText: null, goodbyeMessageMedia: null },
      });

      await upd.replyText(md(i18next.t("goodbye.reset", { lng: lng })));
    } catch (err) {
      await upd.replyText(
        md(i18next.t("errors:goodbye.resetting_goodbye_message", { lng: lng })),
      );
    }
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

    try {
      const goodbyeMessage = await prisma.chat.findUnique({
        where: { id: upd.chat.id },
        select: { goodbyeMessageText: true, goodbyeMessageMedia: true },
      });

      const defaultMessage = md(i18next.t("goodbye.default", { lng: lng }));

      if (goodbyeMessage?.goodbyeMessageMedia) {
        await upd.replyText(
          md`${md(i18next.t("goodbye.message_header", { lng: lng }))}`,
        );
        await upd.client.sendMedia(
          upd.chat.id,
          InputMedia.auto(goodbyeMessage.goodbyeMessageMedia, {
            caption: goodbyeMessage.goodbyeMessageText || "",
          }),
        );
      } else {
        await upd.replyText(
          md`${md(i18next.t("goodbye.message_header", { lng: lng }))}\n\n${goodbyeMessage?.goodbyeMessageText || defaultMessage}`,
        );
      }
    } catch (err) {
      await upd.replyText(
        md(i18next.t("errors:goodbye.showing_goodbye_message", { lng: lng })),
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
    ? "goodbye.enabled"
    : "goodbye.disabled";
  const errorMessageKey = enableGoodbye
    ? "errors:goodbye.enabling_goodbye_message"
    : "errors:goodbye.disabling_goodbye_message";

  try {
    await prisma.chat.update({
      where: { id: upd.chat.id },
      data: { goodbyeEnabled: enableGoodbye },
    });

    await upd.replyText(md(i18next.t(successMessageKey, { lng: lng })));
  } catch (err) {
    await upd.replyText(md(i18next.t(errorMessageKey, { lng: lng })));
  }
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

    try {
      await prisma.chat.update({
        where: { id: upd.chat.id },
        data: {
          goodbyeMessageText: md.unparse(upd.textWithEntities),
          goodbyeMessageMedia: upd.media?.fileId || null,
        },
      });

      await upd.replyText(md(i18next.t("goodbye.set", { lng: lng })));
    } catch (err) {
      await upd.replyText(
        md(i18next.t("errors:goodbye.setting_goodbye_message", { lng: lng })),
      );
    }
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
    i18next.t("goodbye.default", { lng: lng })
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

/* -------------------------------- Delete telegram service msg
 */
dp.onNewMessage(filters.action("user_left"), async (upd) => {
  try {
    const deleteDefaultGoodbye = await prisma.chat
      .findUnique({
        where: { id: upd.chat.id },
        select: { deleteDefaultGoodbye: true },
      })
      .then((chat) => chat?.deleteDefaultGoodbye);

    if (!deleteDefaultGoodbye) {
      return;
    }

    await upd.delete();
  } catch (err) {
    await upd.replyText(
      md(i18next.t("errors:common.deleting_service_message")),
    );
    return;
  }
});

mod.addDispatchers(dp);
export default mod;
