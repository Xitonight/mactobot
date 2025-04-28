import { Dispatcher, filters } from "@mtcute/dispatcher";
import i18next from "@utils/i18n";
import { getChat, prisma } from "@utils/databases";
import { Module } from "@modules/index";
import { service } from "node_modules/@mtcute/dispatcher/filters/message";

const dp = Dispatcher.child();
const mod = new Module(import.meta.dirname);

const services = [
  "message_pinned",
  "game_score",
  "title_changed",
  "photo_changed",
  "photo_deleted",
  "users_added",
  "user_left",
  "user_removed",
  "user_joined_link",
  "user_joined_approved",
  "payment_received",
  "payment_sent",
  "group_call_started",
  "group_call_ended",
  "group_call_scheduled",
  "group_call_invite",
  "topic_created",
  "topic_edited",
  "theme_changed",
  "wallpaper_changed",
];

dp.onNewMessage(filters.command("cleanservice"), async (upd) => {});

dp.onNewMessage(filters.service, async (upd) => {
  const chat = await getChat(upd.chat.id);

  if (chat.serviceMessagesToClean.includes(upd.action.type)) {
    await upd.delete();
  }
});

mod.addDispatchers(dp);
export default mod;
