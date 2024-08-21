import { Dispatcher, filters } from "@mtcute/dispatcher";
import { BotKeyboard, InlineKeyboardMarkup } from "@mtcute/node";
import { buildPages } from "#bot/tools/keyboards.js";
import {
  Module,
  getModules,
  modulesDir,
  getModuleFromName,
  getSettingFromName,
} from "#bot/modules/index.js";
import {
  changePageButton,
  settingsButton,
  rightID,
  cacheUserCommand,
  uncacheUserCommand,
} from "#bot/tools/buttons.js";
import { textEn } from "./locales.js";

interface SettingsState {
  pages: InlineKeyboardMarkup[];
  currentModulesPage: number;
  currentAdditionalsPage: number;
  currentModule: string;
  currentSetting: string;
}

const dp = Dispatcher.child<SettingsState>();

// -------------- generate defaults -------------- //
// dp.onChatMemberUpdate(filters.action("users_added"), async (ctx) => {});

// -------------- close button -------------- //
dp.onCallbackQuery(filters.regex(/close-message/), async (ctx) => {
  uncacheUserCommand((await ctx.getMessage())!);
  await ctx.client.deleteMessagesById(ctx.chat.id, [ctx.messageId]);
});

// -------------- /settings -------------- //
dp.onNewMessage(filters.command("settings"), async (ctx) => {
  const message = await ctx.replyText("Where do you want to open settings?", {
    replyMarkup: BotKeyboard.inline([
      [
        BotKeyboard.callback(
          "Here",
          settingsButton.build({
            action: "here",
            value: "",
          })
        ),
        BotKeyboard.url("PM", `https://t.me/litobot?start=settings`),
      ],
      [BotKeyboard.callback("❌ Close", "close-message")],
    ]),
  });
  cacheUserCommand(message, ctx.sender.id);
});

// -------------- settings here -------------- //
dp.onCallbackQuery(
  filters.and(
    settingsButton.filter(() => ({ action: "here" })),
    await rightID()
  ),
  async (ctx, state) => {
    let markupPages: InlineKeyboardMarkup[] = [];
    const modules = await getModules([
      `${modulesDir}/extra`,
      `${modulesDir}/core`,
    ]);
    let mods = modules.map((module) => module.name);

    markupPages = await buildPages(
      mods,
      {
        rows: 6,
        columns: 2,
        changePageCallback: "modules",
        prefix: "settings|modules",
        closeButton: true,
      },
      ctx.user.id
    );

    await state.set({
      currentModulesPage: 0,
      currentAdditionalsPage: 0,
      pages: markupPages,
      currentModule: "",
      currentSetting: "",
    });
    await ctx.editMessage({ text: textEn, replyMarkup: markupPages[0] });
  }
);

// -------------- modules change page -------------- //
dp.onCallbackQuery(
  filters.and(changePageButton.filter({ type: "modules" }), await rightID()),
  async (ctx, state) => {
    const index = parseInt(ctx.match.index);
    const pages = await state.get().then((setting) => setting?.pages!);
    ctx.editMessage({ text: textEn, replyMarkup: pages[index] });
    await state.merge({ currentModulesPage: index });
  }
);

// -------------- module main page -------------- //
dp.onCallbackQuery(
  filters.and(
    settingsButton.filter(() => ({ action: "modules" })),
    await rightID()
  ),
  async (ctx, state) => {
    const mods = await getModules([
      `${modulesDir}/extra`,
      `${modulesDir}/core`,
    ]);
    const module = getModuleFromName(`${ctx.match.value}`, mods);
    await state.merge({ currentModule: module?.name });
    const index = (await state.get())?.currentModulesPage;
    let markup = BotKeyboard.builder(1)
      .push(
        module?.additionalSettings.length! > 0 &&
          BotKeyboard.callback(
            "Additional settings",
            settingsButton.build({
              action: "additionals",
              value: `${module?.name}`,
            })
          )
      )
      .push(
        BotKeyboard.callback(
          "🔙 Back",
          changePageButton.build({
            type: "modules",
            index: `${index}`,
          })
        )
      )
      .asInline();
    await ctx.editMessage({ text: module?.description, replyMarkup: markup });
  }
);

// -------------- module additional settings -------------- //
dp.onCallbackQuery(
  filters.and(
    settingsButton.filter(() => ({
      action: "additionals",
    })),
    await rightID()
  ),
  async (ctx) => {
    const mods = await getModules([
      `${modulesDir}/extra`,
      `${modulesDir}/core`,
    ]);
    const module = getModuleFromName(`${ctx.match.value}`, mods)!;
    const additionalSettings = module?.additionalSettings.map(
      (setting) => setting.name
    );
    const markupPages: InlineKeyboardMarkup[] = await buildPages(
      additionalSettings,
      {
        rows: 6,
        columns: 1,
        changePageCallback: "additionals",
        prefix: "settings|setting",
        backButton: `settings|modules|${module.name}`,
      },
      ctx.user.id
    );
    await ctx.editMessage({
      text: module?.additionalSettingsDescription,
      replyMarkup: markupPages[0],
    });
  }
);

// -------------- module additional settings change page -------------- //
dp.onCallbackQuery(
  filters.and(
    changePageButton.filter(() => ({
      type: "additionals",
    })),
    await rightID()
  ),
  async (ctx, state) => {
    const index = parseInt(ctx.match.index);
    const pages = await state.get().then((setting) => setting?.pages!);
    ctx.editMessage({ replyMarkup: pages[index] });
    await state.merge({ currentAdditionalsPage: index });
  }
);

// -------------- setting handler -------------- //
dp.onCallbackQuery(
  filters.and(
    settingsButton.filter(() => ({ action: "setting" })),
    await rightID()
  ),
  async (ctx, state) => {
    const modules = await getModules([
      `${modulesDir}/extra`,
      `${modulesDir}/core`,
    ]);
    const module = await state
      .get()
      .then((setting) => getModuleFromName(setting?.currentModule!, modules));
    const setting = getSettingFromName(
      `${ctx.match.value}`,
      module?.additionalSettings!
    )!;
    await state.merge({ currentSetting: `${setting}` });
    const values = setting.values;
    const index = (await state.get())?.currentAdditionalsPage;
    let builder = BotKeyboard.builder(5);
    for (const value of values) {
      builder.append(
        BotKeyboard.callback(
          `${value}`,
          settingsButton.build({
            action: "value",
            value: `${value}`,
          })
        )
      );
    }
    builder.row([
      BotKeyboard.callback(
        "Set custom value",
        settingsButton.build({
          action: "custom",
          value: `${module?.name}`,
        })
      ),
    ]);
    builder.row([
      BotKeyboard.callback(
        "🔙 Back",
        changePageButton.build({
          type: "additionals",
          index: `${index}`,
        })
      ),
    ]);
    const markup = builder.asInline();
    await ctx.editMessage({
      text: `Select the new value for ${setting.name}`,
      replyMarkup: markup,
    });
  }
);

// -------------- custom value handler --------------
dp.onCallbackQuery(
  filters.and(
    settingsButton.filter(() => ({ action: "custom" })),
    await rightID()
  ),
  async (ctx, state) => {
    const currentSetting = (await state.get())?.currentSetting;
    const markup = BotKeyboard.inline([
      [BotKeyboard.callback("🔙 Back", `settings|setting|${currentSetting}`)],
    ]);
    await ctx.editMessage({
      text: "Enter a custom value",
      replyMarkup: markup,
    });
  }
);

// -------------- value handler -------------- //
dp.onCallbackQuery(
  filters.and(
    settingsButton.filter(() => ({ action: "value" })),
    await rightID()
  ),
  async (ctx, state) => {
    const modules = await getModules([
      `${modulesDir}/extra`,
      `${modulesDir}/core`,
    ]);
    const module = await state
      .get()
      .then((setting) => getModuleFromName(setting?.currentModule!, modules));
    const setting = getSettingFromName(
      `${ctx.match.value}`,
      module?.additionalSettings!
    )!;
    await ctx.editMessage({ text: "Value changed" });
  }
);

const mod: Module = {
  name: "Settings",
  description: "Open settings",
  additionalSettings: [],
  additionalSettingsDescription: "",
  commands: ["settings"],
  dispatchers: [dp],
  type: "core",
};

export default mod;
