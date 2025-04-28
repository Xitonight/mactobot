import { Module } from "@modules/index";
import { Dispatcher, filters } from "@mtcute/dispatcher";
import { BotKeyboard } from "@mtcute/node";

const dp = Dispatcher.child();
const mod: Module = new Module(import.meta.dirname);

const startMarkup = BotKeyboard.builder()
  .push(
    BotKeyboard.url(
      "Add me to your group!",
      "http://t.me/mactobot?startgroup=botstart",
    ),
    BotKeyboard.callback("Take a look at what i can do!", "open_help"),
  )
  .asInline();

dp.onNewMessage(
  filters.and(mod.isEnabled(), filters.command("start")),
  async (msg) => {
    await msg.replyText(`🌜 Hi! How may i help you?`, {
      replyMarkup: startMarkup,
    });
  },
);

mod.addDispatchers(dp);
export default mod;
