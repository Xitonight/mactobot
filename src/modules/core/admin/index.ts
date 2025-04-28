import { Dispatcher, filters } from "@mtcute/dispatcher";
import { Module } from "@modules/index";
import {
  db,
  getRole,
  getUserInChat,
  prisma,
  upsertChat,
  upsertRole,
  upsertUser,
  upsertUserInChat,
} from "@utils/databases";
import { md } from "@mtcute/markdown-parser";
import i18next from "@utils/i18n";
import { getLang } from "@utils/language";
import { tryCatch } from "@maxmorozoff/try-catch-tuple";
import { replyError, replyTooManyArgs } from "@utils/errors";

const dp = Dispatcher.child();
const mod = new Module(import.meta.dirname);

dp.onChatMemberUpdate(
  filters.or(filters.chatMember("joined"), filters.chatMember("added")),
  async (upd) => {
    if (upd.isSelf) {
      await upsertChat(upd.chat.id);
      await upd.client.getChatMembers(upd.chat.id).then((members) =>
        members
          .filter((member) => !member.user.isBot)
          .map((member) => member.user)
          .forEach(async (member) => {
            await upsertUser(member.id, member.username || member.displayName);
            await upsertUserInChat(member.id, upd.chat.id);
          }),
      );
      return;
    }

    await upsertUser(upd.user.id, upd.user.username || upd.user.displayName);
    await upsertUserInChat(upd.user.id, upd.chat.id);
  },
);

dp.onNewMessage(filters.command("createUsers"), async (upd) => {
  await prisma.chat.upsert({
    where: {
      id: upd.chat.id,
    },
    update: {},
    create: { id: upd.chat.id },
  });
  await upd.client.getChatMembers(upd.chat.id).then((members) =>
    members
      .filter((member) => !member.user.isBot)
      .map((member) => member.user)
      .forEach(async (user) => {
        await prisma.user.upsert({
          where: { id: user.id },
          update: { id: user.id, username: user.username || user.displayName },
          create: { id: user.id, username: user.username || user.displayName },
        });
        await prisma.userInChat.upsert({
          where: { userId_chatId: { userId: user.id, chatId: upd.chat.id } },
          update: { userId: user.id, chatId: upd.chat.id },
          create: { userId: user.id, chatId: upd.chat.id },
        });
      }),
  );
});

dp.onNewMessage(filters.command("newrole"), async (upd) => {
  const lng = await getLang(upd.chat.id);

  if (upd.command[2]) {
    await replyTooManyArgs(upd, "usage:admin.newrole");
    return;
  }

  if (await getRole(upd.chat.id, upd.command[1])) {
    await replyError(upd, "errors:admin.role_exists");
    return;
  }

  await upsertRole(upd.chat.id, upd.command[1]);

  await upd.replyText(
    md(i18next.t("ns1:admin.created_role", { lng: lng, role: upd.command[1] })),
  );
});

dp.onNewMessage(filters.command("setrole"), async (upd) => {
  const lng = await getLang(upd.chat.id);

  if (upd.replyToMessage && upd.command[2]) {
    await replyTooManyArgs(upd, "usage:admin.setrole");
    return;
  }

  const target = upd.replyToMessage
    ? await upd.getReplyTo().then((msg) => msg.sender)
    : await upd.client.getUser(upd.command[1].replace("@", ""));

  const user = await getUserInChat(target.id, upd.chat.id);

  if (!user) {
    await replyError(upd, "errors:common.user_not_found");
    return;
  }

  const role = await prisma.role.findUnique({
    where: {
      chatId: upd.chat.id,
      name: upd.replyToMessage ? upd.command[1] : upd.command[2],
    },
  });

  if (!role) {
    await replyError(upd, "errors:admin.role_not_found");
    return;
  }

  if (user.roleId === role.id) {
    await upd.replyText(
      md(
        i18next.t("errors:admin.already_has_role", {
          lng: lng,
          user: target.displayName,
          role: role.name,
        }),
      ),
    );
    return;
  }

  await prisma.userInChat.update({
    where: { userId_chatId: { userId: target.id, chatId: upd.chat.id } },
    data: { roleId: role.id },
  });

  await upd.replyText(
    md(
      i18next.t("ns1:admin.role_given", { lng: lng, user: target.displayName }),
    ),
  );
});

dp.onNewMessage(filters.and(filters.command("roles"), db()), async (upd) => {
  const lng = await getLang(upd.chat.id);

  if (upd.command[1]) {
    await upd.replyText(
      md`${md(i18next.t("errors:common.too_many_args", { lng: lng }))}\n\n${md(i18next.t("usage:admin.roles", { lng: lng }))}`,
    );
    return;
  }

  const roles = await prisma.role.findMany({
    where: { chatId: upd.chat.id },
  });

  if (roles.length == 0) {
    await upd.replyText(
      md`${md(i18next.t("errors:admin.no_roles", { lng: lng }))}`,
    );
    return;
  }

  let rolesList = `${i18next.t("ns1:admin.roles_header", {
    lng: lng,
    chat: upd.chat.displayName,
  })}\n`;

  roles.forEach((role) => {
    rolesList = rolesList.concat(`- \`${role.name}\``, "\n");
  });

  await upd.replyText(md(rolesList));
});

dp.onNewMessage(filters.command(/role @(\S+)(.*)$/), async (upd) => {
  const lng = await getLang(upd.chat.id);

  if (upd.command[2]) {
    await upd.replyText(
      md`${md(i18next.t("errors:common.too_many_args", { lng: lng }))}\n${md(i18next.t("usage:ids.id", { lng: lng }))}`,
    );
    return;
  }

  const [peer, error] = await tryCatch(upd.client.resolvePeer(upd.command[1]));

  if (error) {
    await upd.replyText(
      md(i18next.t("errors:common.user_not_found", { lng: lng })),
    );
    return;
  }
});

mod.addDispatchers(dp);
export default mod;
