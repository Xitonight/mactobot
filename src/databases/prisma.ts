import { PrismaClient } from "@prisma/client";
import { Dispatcher, filters } from "@mtcute/dispatcher";

const prisma = new PrismaClient();

const dp = Dispatcher.child();

dp.onChatMemberUpdate(
  filters.and(filters.chatMemberSelf, filters.chatMember("joined")),
  async (upd) => {
    const chat = await prisma.chat.findUnique({
      where: {
        id: upd.chat.id,
      },
    });

    if (!!chat) {
      return;
    }

    await prisma.chat.create({
      data: {
        id: upd.chat.id,
      },
    });
  },
);

export { prisma, dp };
