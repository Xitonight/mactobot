import { cache } from "#bot/modules/db.js";
import { CallbackDataBuilder } from "@mtcute/dispatcher";
import { Message } from "@mtcute/node";

/**
 * Since there's no way of knowing who's the sender of the command message,
 * there's no way to make a button clickable only by the sender of the command.
 *
 * I "figured out" the message could be cached to a database and then checked
 * if the ids match.
 * @param message - The message object (gets fetched to retrieve chatId, messageId and such)
 * @param userId - The user id that sent the command
 */
export const cacheUserCommand = async (message: Message, userId: number) => {
  const chatId = message.chat.id;
  const msgId = message.id;
  cache.insertOne({
    chatId: chatId,
    msgId: msgId,
    userId: userId,
    date: new Date().toLocaleDateString(),
    time: new Date().toTimeString().split(" ")[0],
  });
};

export const uncacheUserCommand = async (message: Message) => {
  const chatId = message.chat.id;
  const msgId = message.id;
  cache.deleteOne({
    chatId: chatId,
    msgId: msgId,
  });
};

/**
 * Returns true if the user that clicked the button is the
 * same user that sent the command message.
 */
export const rightID = async () => async (ctx: any) => {
  const msgId = await ctx.getMessage().then((msg: any) => msg.id);
  const chatId = ctx.chat.id;
  const rightId = await cache
    .findOne({ msgId: msgId, chatId: chatId })
    .then((doc) => doc?.userId);
  const senderId = ctx.user.id;
  return rightId === senderId;
};

export const changePageButton = new CallbackDataBuilder(
  "page",
  "type",
  "index"
);
changePageButton.sep = "|";

export const settingsButton = new CallbackDataBuilder(
  "settings",
  "action",
  "value"
);
settingsButton.sep = "|";
