import { Dispatcher, filters } from "@mtcute/dispatcher";
import { Module } from "@modules/index";
import { prisma } from "@utils/databases";

const dp = Dispatcher.child();
const mod = new Module("admin", "core");

dp.onChatMemberUpdate(
  filters.and(
    filters.not(filters.chatMemberSelf),
    filters.or(filters.chatMember("added"), filters.chatMember("joined")),
  ),
  async (upd) => {
    await prisma.user.upsert({
      where: { id: upd.user.id },
      update: {},
      create: { id: upd.user.id },
    });

    await prisma.userInChat.upsert({
      where: { userId_chatId: { userId: upd.user.id, chatId: upd.chat.id } },
      update: { isAdmin: false },
      create: { userId: upd.user.id, chatId: upd.chat.id },
    });
  },
);

dp.onChatMemberUpdate(
  filters.and(
    filters.chatMemberSelf,
    filters.or(filters.chatMember("joined"), filters.chatMember("added")),
  ),
  async (upd) => {
    await prisma.chat.upsert({
      where: {
        id: upd.chat.id,
      },
      update: {},
      create: { id: upd.chat.id },
    });
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

mod.addDispatchers(dp);
export default mod;
