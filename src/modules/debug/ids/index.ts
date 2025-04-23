import { Dispatcher, filters } from "@mtcute/dispatcher";
import { Module } from "@modules/.";
import i18next from "i18next";
import { getLang } from "@utils/language";
import { md } from "@mtcute/markdown-parser";

const dp = Dispatcher.child();
const mod = new Module("ids", "debug");

dp.onNewMessage(filters.command("getid"), async (upd) => {
  const lng = await getLang(upd.chat.id);
  if (upd.replyToMessage) {
    await upd.replyText(
      md`${md(i18next.t("ids.message_id", { lng: lng }))} ${upd.replyToMessage.id}`,
    );
  }
});

mod.addDispatchers(dp);
export default mod;
