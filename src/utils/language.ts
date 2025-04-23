import { prisma } from "./databases.ts";

export const getLang = async (chatId: number) => {
  return await prisma.chat
    .findUnique({
      where: { id: chatId },
      select: { language: true },
    })
    .then((chat) => chat?.language as string);
};
