import { Dispatcher, filters } from "@mtcute/dispatcher";
import i18next from "@utils/i18n";
import { md } from "@mtcute/markdown-parser";
import { prisma } from "@utils/databases";
import { Module } from "@modules/index";

const dp = Dispatcher.child();
const supported_languages = ["en", "it"];
const mod = new Module("language", "core");

dp.onNewMessage(filters.command("language"), async (upd) => {
  const lng: string = await prisma.chat
    .findUnique({
      where: { id: upd.chat.id },
      select: { language: true },
    })
    .then((chat) => chat?.language as string);

  if (!upd.command[1]) {
    await upd.replyText(
      md`
${md(
  i18next.t("language.settings", {
    lng: lng,
    lang: await prisma.chat
      .findUnique({
        where: { id: upd.chat.id },
        select: { language: true },
      })
      .then((chat) => chat?.language),
  }),
)}    

${md(i18next.t("language.supported", { lng: lng }))}
      `,
    );
    return;
  }

  if (upd.command.length > 2) {
    await upd.replyText(
      md`
${md(i18next.t("errors:common.too_many_args", { lng: lng }))}

${md(i18next.t("usage:language.default", { lng: lng }))}
      `,
    );

    return;
  }

  if (!supported_languages.includes(upd.command[1])) {
    await upd.replyText(md`
${md(i18next.t("errors:language.unsupported_lang", { lng: lng }))}

${md(i18next.t("language.supported", { lng: lng }))}
    `);
    return;
  }

  try {
    await prisma.chat.update({
      where: { id: upd.chat.id },
      data: { language: upd.command[1] },
    });

    await upd.replyText(md(i18next.t("language.set", { lng: upd.command[1] })));
  } catch (err) {
    await upd.replyText(
      md(i18next.t("errors:common.custom", { lng: lng, err: err })),
    );
  }
});

mod.addDispatchers(dp);
export default mod;
