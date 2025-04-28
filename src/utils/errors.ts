import { MessageContext, UpdateFilter } from "@mtcute/dispatcher";
import { md } from "@mtcute/markdown-parser";
import { InputText, Message } from "@mtcute/node";
import i18next, { ErrorKeys, TranslationKey, UsageKeys } from "@utils/i18n";
import { getLang } from "./language";

export const errorFilter =
  (): UpdateFilter<
    MessageContext,
    { replyError: (err: InputText) => Promise<Message>; lang: string }
  > =>
  async (upd) => {
    (upd as any).lang = await getLang(upd.chat.id);
    (upd as any).replyError = async (err: InputText) => {
      return await upd.replyText(
        md(i18next.t("errors:common.custom", { err: err })),
      );
    };
    return true;
  };

export const replyError = async (upd: MessageContext, errorKey: ErrorKeys) => {
  const lng = await getLang(upd.chat.id);
  await upd.replyText(md(i18next.t(errorKey as TranslationKey, { lng: lng })));
};

export const replyTooManyArgs = async (
  upd: MessageContext,
  usage?: UsageKeys,
) => {
  const lng = await getLang(upd.chat.id);
  await upd.replyText(
    md`${md(i18next.t("errors:common.too_many_args", { lng: lng }))}\n\n${md(i18next.t(usage as TranslationKey, { lng: lng }))}`,
  );
};

export const replyMissingArgs = async (
  upd: MessageContext,
  usage?: UsageKeys,
) => {
  const lng = await getLang(upd.chat.id);
  await upd.replyText(
    md`${md(i18next.t("errors:common.missing_args", { lng: lng }))}\n\n${md(i18next.t(usage as TranslationKey, { lng: lng }))}`,
  );
};

export const replyUnknownArgs = async (
  upd: MessageContext,
  usage?: UsageKeys,
) => {
  const lng = await getLang(upd.chat.id);
  await upd.replyText(
    md`${md(i18next.t("errors:common.unknown_args", { lng: lng }))}\n\n${md(i18next.t(usage as TranslationKey, { lng: lng }))}`,
  );
};
