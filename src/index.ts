import { md, SqliteStorage, TelegramClient } from "@mtcute/node";
import { Dispatcher, filters, SqliteStateStorage } from "@mtcute/dispatcher";
import * as dotenv from "dotenv";
import { getModules } from "./modules";
import path from "path";
import i18next from "./utils/i18n";
import { getLang } from "./utils/language";

dotenv.config();

const storage = new SqliteStorage("storage/bot");

const tg = new TelegramClient({
  apiId: Number(process.env.API_ID),
  apiHash: `${process.env.API_HASH}`,
  storage: storage,
});

const dp = Dispatcher.for<any>(tg, {
  storage: SqliteStateStorage.from(storage),
});

const modules = await getModules(
  ["core", "extra", "debug"].map((type) =>
    path.join(import.meta.dirname, "modules", type),
  ),
);

for (const mod of Object.values(modules)) {
  for (const dispatcher of mod.dispatchers) {
    dp.extend(dispatcher);
  }
}

dp.onNewMessage(
  filters.and(
    filters.userId(process.env.OWNER_ID),
    filters.command(/(enable|disable)mod/),
  ),
  async (upd) => {
    const lng = await getLang(upd.chat.id);

    if (!upd.command[2]) {
      await upd.replyText(
        md(i18next.t("errors:common.missing_args", { lng: lng })),
      );
      return;
    }

    if (upd.command[3]) {
      await upd.replyText(
        md(i18next.t("errors:common.too_many_args", { lng: lng })),
      );
      return;
    }

    const enabling = upd.command[1] === "enable";
    modules[upd.command[1]].enabled = enabling;
    await upd.replyText(
      md(
        i18next.t(
          enabling ? "ns1:enablemod.success" : "ns1:disablemod.success",
          {
            lng: lng,
          },
        ),
      ),
    );
  },
);

const self = await tg.start({
  botToken: process.env.BOT_TOKEN!,
});

console.log(`Bot started as ${self.username}`);
