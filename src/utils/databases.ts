import { MessageContext, UpdateFilter } from "@mtcute/dispatcher";
import { InputPeerLike, InputText, Message } from "@mtcute/node";
import { Chat, Prisma, PrismaClient, User, UserInChat } from "@prisma/client";
import { createClient } from "redis";

export const redis = await createClient()
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export const prisma = new PrismaClient();

export const db =
  (): UpdateFilter<
    MessageContext,
    {
      getChatSettings: () => Promise<Chat>;
      getUser: (userId: InputPeerLike) => Promise<UserInChat>;
    }
  > =>
  async (upd) => {
    (upd as any).getChatSettings = async () => await getChat(upd.chat.id);
    (upd as any).getUser = async (userId: number) =>
      await getUserInChat(userId, upd.chat.id);
    return true;
  };

export const getChat = async (chatId: number) => {
  return await prisma.chat.findUnique({
    where: { id: chatId },
  });
};

export const getUserInChat = async (userId: number, chatId: number) => {
  return await prisma.userInChat.findUnique({
    where: { userId_chatId: { userId: userId, chatId: chatId } },
  });
};

export const getRole = async (chatId: number, name: string) => {
  return await prisma.role.findUnique({
    where: { chatId: chatId, name: name },
  });
};

export const upsertRole = async (chatId: number, name: string) => {
  return await prisma.role.upsert({
    where: { chatId: chatId, name: name },
    update: {},
    create: { chatId: chatId, name: name },
  });
};

export const upsertUser = async (id: number, username: string) => {
  return await prisma.user.upsert({
    where: { id: id },
    update: {
      username: username,
    },
    create: {
      id: id,
      username: username,
    },
  });
};

export const upsertUserInChat = async (id: number, chatId: number) => {
  return await prisma.userInChat.upsert({
    where: {
      userId_chatId: { userId: id, chatId: chatId },
    },
    update: {},
    create: { userId: id, chatId: chatId },
  });
};

export const upsertChat = async (chatId: number) => {
  return await prisma.chat.upsert({
    where: { id: chatId },
    update: {},
    create: { id: chatId },
  });
};
