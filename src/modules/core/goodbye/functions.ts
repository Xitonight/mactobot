import { Dispatcher, filters, PropagationAction } from "@mtcute/dispatcher";
import { prisma } from "../../../databases/prisma.ts";
import { md } from "@mtcute/markdown-parser";
import i18next from "../../../utils/i18n.ts";
import { unparseMarkdown } from "../../../utils/unparser.ts";

interface goodbyeState {
  enteringNewMessage: boolean;
  reply_id: number;
}

const dp = Dispatcher.child<goodbyeState>();

dp.onNewMessage(filters.command("goodbye"), async (upd, state) => {
  const lng: string = await prisma.chat
    .findUnique({
      where: { id: upd.chat.id },
      select: { language: true },
    })
    .then((chat) => chat?.language as string);

  // If no args are passed, show the state of the goodbye cmd
  if (!upd.command[1]) {
    const goodbyeState = await prisma.chat.findUnique({
      where: { id: upd.chat.id },
      select: {
        goodbyeEnabled: true,
        goodbyeMessage: true,
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

  // Handle /goodbye delete cases
  if (upd.command[1] == "delete") {
    const usage = md(i18next.t("goodbye.usage.delete_default", { lng: lng }));

    if (!upd.command[2]) {
      await upd.replyText(
        md`${md(i18next.t("errors.common.missing_args", { lng: lng }))}\n\n${usage}`,
      );
      return;
    }

    if (upd.command[2] != "default") {
      await upd.replyText(
        md`${md(i18next.t("errors.common.unknown_args", { lng: lng }))}\n\n${usage}`,
      );
      return;
    }

    if (!upd.command[3]) {
      await upd.replyText(
        md`${md(i18next.t("errors.common.missing_args", { lng: lng }))}\n\n${usage}`,
      );
      return;
    }

    if (!["on", "off"].includes(upd.command[3])) {
      await upd.replyText(
        md`${md(i18next.t("errors.common.unknown_args", { lng: lng }))}\n\n${usage}`,
      );
      return;
    }

    if (upd.command[4]) {
      await upd.replyText(
        md`${md(i18next.t("errors.common.too_many_args", { lng: lng }))}\n\n${usage}`,
      );
      return;
    }

    const enableDeleteDefault = upd.command[3] === "on";
    const successMessageKey = enableDeleteDefault
      ? "goodbye.enable_delete_default"
      : "goodbye.disable_delete_default";
    const errorMessageKey = enableDeleteDefault
      ? "errors.goodbye.enabling_delete_default"
      : "errors.goodbye.disabling_delete_default";

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

  // Handle /goodbye set cases
  if (upd.command[1] == "set") {
    const usage = md(i18next.t("goodbye.usage.set", { lng: lng }));
    // No args passed, set the new goodbye msg
    if (!upd.command[2]) {
      const reply_id = await upd
        .replyText(md(i18next.t("goodbye.enter_new", { lng: lng })))
        .then((msg) => msg.id);
      await state.set({ enteringNewMessage: true, reply_id: reply_id }, 1800);
      return;
    }

    // Second argument is not "default", throw error for unknown arg
    if (upd.command[2] != "default") {
      await upd.replyText(
        md`${md(i18next.t("errors.common.unknown_args", { lng: lng }))}\n\n${usage}`,
      );
      return;
    }

    if (upd.command.length > 3) {
      await upd.replyText(
        md`${md(i18next.t("errors.common.too_many_args", { lng: lng }))}\n\n${usage}`,
      );
      return;
    }

    try {
      await prisma.chat.update({
        where: { id: upd.chat.id },
        data: { goodbyeMessage: null },
      });

      await upd.replyText(md(i18next.t("goodbye.reset", { lng: lng })));
    } catch (err) {
      await upd.replyText(
        md(i18next.t("errors.goodbye.resetting_goodbye_message", { lng: lng })),
      );
    }
    return;
  }

  if (upd.command[1] === "show") {
    const usage = md(i18next.t("goodbye.usage.show", { lng: lng }));
    if (upd.command[2]) {
      await upd.replyText(
        md`${md(i18next.t("errors.common.too_many_args"))}\n\n${usage}`,
      );
      return;
    }

    try {
      const goodbyeMessage = await prisma.chat
        .findUnique({
          where: { id: upd.chat.id },
          select: { goodbyeMessage: true },
        })
        .then((chat) => chat?.goodbyeMessage);

      const defaultMessage = md(i18next.t("goodbye.default", { lng: lng }));
      await upd.replyText(
        md`${md(i18next.t("goodbye.message_header", { lng: lng }))}\n\n${goodbyeMessage || defaultMessage}`,
      );
    } catch (err) {
      await upd.replyText(
        md(i18next.t("errors.goodbye.showing_goodbye_message", { lng: lng })),
      );
    }
    return;
  }

  const usage = md(i18next.t("goodbye.usage.default", { lng: lng }));

  if (!["on", "off"].includes(upd.command[1])) {
    await upd.replyText(
      md`${md(i18next.t("errors.common.unknown_args", { lng: lng }))}\n\n${usage}`,
    );
    return;
  }

  // Throw error if more than 1 args are passed
  if (upd.command[2]) {
    await upd.replyText(
      md`${md(i18next.t("errors.common.too_many_args", { lng: lng }))}\n\n${usage}`,
    );
    return;
  }

  const enableGoodbye = upd.command[1] === "on";
  const successMessageKey = enableGoodbye
    ? "goodbye.enabled"
    : "goodbye.disabled";
  const errorMessageKey = enableGoodbye
    ? "errors.goodbye.enabling_goodbye_message"
    : "errors.goodbye.disabling_goodbye_message";

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

/*------------------------------------- NEW GOODBYE MESSAGE -------------------------------------------*/
dp.onNewMessage(
  filters.and(
    filters.reply,
    filters.state((state) => state.enteringNewMessage),
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
        data: { goodbyeMessage: unparseMarkdown(upd.textWithEntities) },
      });

      await upd.replyText(md(i18next.t("goodbye.set", { lng: lng })));
    } catch (err) {
      await upd.replyText(
        md(i18next.t("errors.goodbye.setting_goodbye_message", { lng: lng })),
      );
    }
    await state.delete();
    return PropagationAction.Stop;
  },
  -1,
);

/*-------------------------------------- BID FAREWELL --------------------------------------*/
dp.onChatMemberUpdate(filters.chatMember("left"), async (upd) => {
  const goodbyeSettings = await prisma.chat.findUnique({
    where: { id: upd.chat.id },
    select: {
      goodbyeEnabled: true,
      goodbyeMessage: true,
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

  const welcomeMessage = (
    goodbyeSettings.goodbyeMessage || i18next.t("goodbye.default", { lng: lng })
  )
    .replace(/{user_first}/g, upd.user.firstName)
    .replace(/{user_last}/g, upd.user.lastName!)
    .replace(/{user_full}/g, upd.user.displayName)
    .replace(/{user_id}/g, `${upd.user.id}`)
    .replace(/{username}/g, upd.user.username!)
    .replace(/{user_mention}/g, `@${upd.user.username}`)
    .replace(/{chat_id}/g, `${upd.chat.id}`)
    .replace(/{chat_name}/g, `${upd.chat.displayName}`);

  await upd.client.sendText(upd.chat.id, md(welcomeMessage));
});

/*------------------------------- DELETE "user left" MESSAGES ----------------------------------------*/
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
      md(i18next.t("errors.common.deleting_service_message")),
    );
    return;
  }
});

export { dp };
