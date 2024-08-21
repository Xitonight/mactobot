import { BotKeyboard, InlineKeyboardMarkup } from "@mtcute/node";
import { changePageButton } from "#bot/tools/buttons.js";
import { CallbackDataBuilder } from "@mtcute/dispatcher";

export interface KeyboardBuilder {
  rows: number;
  columns: number;
  prefix: string;
  suffix?: string;
  separator?: string;
  backButton?: string;
  closeButton?: boolean;
  changePageCallback: string;
}

export const buildPages = async (
  items: any[],
  {
    rows,
    columns,
    prefix,
    suffix = "",
    separator = "|",
    backButton = "",
    closeButton = false,
    changePageCallback,
  }: KeyboardBuilder,
  id: number
) => {
  let markupPages: InlineKeyboardMarkup[] = [];
  for (let i = 0; i < items.length / rows; i++) {
    let keyboard: InlineKeyboardMarkup;
    let builder = BotKeyboard.builder(columns);
    let j = 0;
    for (const item of items.slice(i * rows * columns)) {
      if (j >= rows * columns) break;
      builder.append(
        BotKeyboard.callback(
          `${item}`,
          `${prefix}${separator}${item}${separator}${suffix}${id}`
        )
      );
      j++;
    }
    builder.row((row) => {
      if (backButton) {
        row.push(
          BotKeyboard.callback("🔙 Back", `${backButton}${separator}${id}`)
        );
      }
    });
    builder.row((row) => {
      if (i > 0) {
        row.push(
          BotKeyboard.callback(
            "⬅️",
            changePageButton.build({
              type: changePageCallback,
              index: `${i - 1}`,
            })
          )
        );
      }
      if (closeButton) {
        row.push(BotKeyboard.callback("❌ Close", "close-message"));
      }
      if (i < items.length / rows - 1) {
        row.push(
          BotKeyboard.callback(
            "➡️",
            changePageButton.build({
              type: changePageCallback,
              index: `${i + 1}`,
            })
          )
        );
      }
    });
    keyboard = builder.asInline();
    markupPages.push(keyboard);
  }
  return markupPages;
};
