import { Dispatcher, filters } from "@mtcute/dispatcher";
import { md } from "@mtcute/markdown-parser";

import { Module } from "@modules/index";
import i18next from "@utils/i18n";
import { getLang } from "@utils/language";
import { getMarkedPeerId } from "@mtcute/node";

import { tryCatch } from "@maxmorozoff/try-catch-tuple";
import { replyTooManyArgs } from "@utils/errors";

const dp = Dispatcher.child();
const mod = new Module(import.meta.dirname);

dp.onNewMessage(filters.command(/^id$/), async (upd) => {
  const lng = await getLang(upd.chat.id);

  const reply = await upd.getReplyTo();
  reply
    ? await upd.replyText(
        md`${md(
          i18next.t("ns1:ids.user_id", {
            lng: lng,
            user:
              reply.sender.mention() +
              (lng == "en"
                ? reply.sender.displayName.endsWith("s")
                  ? "'"
                  : "'s"
                : ""),
          }),
        )} \`${reply.sender.id}\``,
      )
    : await upd.replyText(
        md`${md(i18next.t("ns1:ids.chat_id", { lng: lng, chat: upd.chat.displayName }))} \`${upd.chat.id}\``,
      );
});

dp.onNewMessage(
  filters.and(filters.command(/^id @(\S+)(.*)$/)),
  async (upd) => {
    const lng = await getLang(upd.chat.id);

    if (upd.command[2]) {
      await replyTooManyArgs(upd, "usage:ids.id");
      return;
    }

    const [peer, error] = await tryCatch(
      upd.client.resolvePeer(upd.command[1]),
    );

    if (error) {
      await upd.replyText(
        md(i18next.t("errors:common.user_not_found", { lng: lng })),
      );
      return;
    }

    const id = getMarkedPeerId(peer);
    await upd.replyText(
      md`${md(
        i18next.t("ns1:ids.user_id", {
          lng: lng,
          user:
            `@${upd.command[1]}` +
            (lng == "en" ? (upd.command[1].endsWith("s") ? "'" : "'s") : ""),
        }),
      )} ${id}`,
    );
  },
);

mod.addDispatchers(dp);
export default mod;
