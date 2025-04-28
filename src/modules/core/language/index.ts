import { Dispatcher, filters } from "@mtcute/dispatcher";
import i18next from "@utils/i18n";
import { md } from "@mtcute/markdown-parser";
import { prisma } from "@utils/databases";
import { Module } from "@modules/index";

const dp = Dispatcher.child();
const supported_languages = ["en", "it"];
const mod = new Module(import.meta.dirname);

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
  i18next.t("ns1:language.settings", {
    lng: lng,
    lang: await prisma.chat
      .findUnique({
        where: { id: upd.chat.id },
        select: { language: true },
      })
      .then((chat) => chat?.language),
  }),
)}    

${md(i18next.t("ns1:language.supported", { lng: lng }))}
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

${md(i18next.t("ns1:language.supported", { lng: lng }))}
    `);
    return;
  }

  await prisma.chat.update({
    where: { id: upd.chat.id },
    data: { language: upd.command[1] },
  });

  await upd.replyText(
    md(i18next.t("ns1:language.set", { lng: upd.command[1] })),
  );
});

mod.addDispatchers(dp);
export default mod;
