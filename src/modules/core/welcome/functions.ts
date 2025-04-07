import { Dispatcher, filters, PropagationAction } from "@mtcute/dispatcher";
import { prisma } from "../../../databases/prisma.ts";
import { md } from "@mtcute/markdown-parser";
import i18next from "../../../utils/i18n.ts";
import { unparseMarkdown } from "../../../utils/unparser.ts";

interface welcomeState {
  enteringNewMessage: boolean;
  reply_id: number;
}

const dp = Dispatcher.child<welcomeState>();

/*------------------------------- /welcome --------------------------------------*/

dp.onNewMessage(filters.command("welcome"), async (upd, state) => {
  const lng: string = await prisma.chat
    .findUnique({
      where: { id: upd.chat.id },
      select: { language: true },
    })
    .then((chat) => chat?.language as string);

  // If no args are passed, show the state of the welcome cmd
  if (!upd.command[1]) {
    const welcomeState = await prisma.chat.findUnique({
      where: { id: upd.chat.id },
      select: {
        welcomeEnabled: true,
        welcomeMessage: true,
        deleteDefaultWelcome: true,
      },
    });
    await upd.replyText(
      md(
        i18next.t("welcome.settings", {
          lng: lng,
          enable: welcomeState?.welcomeEnabled ? "on" : "off",
          deleteDefault: welcomeState?.deleteDefaultWelcome ? "on" : "off",
        }),
      ),
    );
    return;
  }

  // Handle /welcome delete cases
  if (upd.command[1] == "delete") {
    const usage = md(i18next.t("welcome.usage.delete_default", { lng: lng }));

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
      ? "welcome.enable_delete_default"
      : "welcome.disable_delete_default";
    const errorMessageKey = enableDeleteDefault
      ? "errors.welcome.enabling_delete_default"
      : "errors.welcome.disabling_delete_default";

    try {
      await prisma.chat.update({
        where: { id: upd.chat.id },
        data: { deleteDefaultWelcome: enableDeleteDefault },
      });

      await upd.replyText(md(i18next.t(successMessageKey, { lng: lng })));
    } catch (err) {
      await upd.replyText(md(i18next.t(errorMessageKey, { lng: lng })));
    }
    return;
  }

  // Handle /welcome set cases
  if (upd.command[1] == "set") {
    const usage = md(i18next.t("welcome.usage.set", { lng: lng }));
    // No args passed, set the new welcome msg
    if (!upd.command[2]) {
      const reply_id = await upd
        .replyText(md(i18next.t("welcome.enter_new", { lng: lng })))
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
        data: { welcomeMessage: null },
      });

      await upd.replyText(md(i18next.t("welcome.reset", { lng: lng })));
    } catch (err) {
      await upd.replyText(
        md(i18next.t("errors.welcome.resetting_welcome_message", { lng: lng })),
      );
    }
    return;
  }

  if (upd.command[1] === "show") {
    const usage = md(i18next.t("welcome.usage.show", { lng: lng }));
    if (upd.command[2]) {
      await upd.replyText(
        md`${md(i18next.t("errors.common.too_many_args"))}\n\n${usage}`,
      );
      return;
    }

    try {
      const welcomeMessage = await prisma.chat
        .findUnique({
          where: { id: upd.chat.id },
          select: { welcomeMessage: true },
        })
        .then((chat) => chat?.welcomeMessage);

      const defaultMessage = md(i18next.t("welcome.default", { lng: lng }));
      await upd.replyText(
        md`${md(i18next.t("welcome.message_header", { lng: lng }))}\n\n${welcomeMessage || defaultMessage}`,
      );
    } catch (err) {
      await upd.replyText(
        md(i18next.t("errors.welcome.showing_welcome_message", { lng: lng })),
      );
    }
    return;
  }

  const usage = md(i18next.t("welcome.usage.default", { lng: lng }));

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

  const enableWelcome = upd.command[1] === "on";
  const successMessageKey = enableWelcome
    ? "welcome.enabled"
    : "welcome.disabled";
  const errorMessageKey = enableWelcome
    ? "errors.welcome.enabling_welcome_message"
    : "errors.welcome.disabling_welcome_message";

  try {
    await prisma.chat.update({
      where: { id: upd.chat.id },
      data: { welcomeEnabled: enableWelcome },
    });

    await upd.replyText(md(i18next.t(successMessageKey, { lng: lng })));
  } catch (err) {
    await upd.replyText(md(i18next.t(errorMessageKey, { lng: lng })));
  }
});

/*-------------------------------- NEW WELCOME MESSAGE ---------------------------------------*/

dp.onNewMessage(
  filters.and(
    filters.state((state) => state.enteringNewMessage),
    filters.reply,
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
        data: { welcomeMessage: unparseMarkdown(upd.textWithEntities) },
      });

      await upd.replyText(md(i18next.t("welcome.set", { lng: lng })));
    } catch (err) {
      await upd.replyText(
        md(i18next.t("errors.welcome.setting_welcome_message", { lng: lng })),
      );
    }
    await state.delete();
    return PropagationAction.Stop;
  },
  -1,
);

/*---------------------------- GREET NEW USER -------------------------------*/

dp.onChatMemberUpdate(
  filters.or(filters.chatMember("joined"), filters.chatMember("added")),
  async (upd) => {
    const welcomeSettings = await prisma.chat.findUnique({
      where: { id: upd.chat.id },
      select: {
        welcomeEnabled: true,
        welcomeMessage: true,
      },
    });

    if (!welcomeSettings?.welcomeEnabled) {
      return;
    }

    const lng: string = await prisma.chat
      .findUnique({
        where: { id: upd.chat.id },
        select: { language: true },
      })
      .then((chat) => chat?.language as string);

    const welcomeMessage = (
      welcomeSettings.welcomeMessage ||
      i18next.t("welcome.default", { lng: lng })
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
  },
);

/*------------------------------- DELETE "user joined" MESSAGES ----------------------------------------*/

dp.onNewMessage(
  filters.action(["user_joined_link", "user_joined_approved", "users_added"]),
  async (upd) => {
    try {
      const deleteDefaultWelcome = await prisma.chat
        .findUnique({
          where: { id: upd.chat.id },
          select: { deleteDefaultWelcome: true },
        })
        .then((chat) => chat?.deleteDefaultWelcome);

      if (!deleteDefaultWelcome) {
        return;
      }

      await upd.delete();
    } catch (err) {
      await upd.replyText(
        md(i18next.t("errors.common.deleting_service_message")),
      );
      return;
    }
  },
);

export { dp };
