import { TelegramClient, TelegramClientOptions } from "@mtcute/node";
import { Dispatcher, MemoryStateStorage } from "@mtcute/dispatcher";
import { Module, modulesDir, getModules } from "#bot/modules/index.js";
import { cwd } from "process";
import { join, parse } from "path";
import dotenv from "dotenv";
import inquirer from "inquirer";
import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "fs";

dotenv.config();

class Bot extends TelegramClient {
  private dispatcher: Dispatcher<any> = Dispatcher.for<any>(this, {
    storage: new MemoryStateStorage(),
  });

  async importModules(modules: Module[]) {
    for (const module of modules) {
      for (const dp of module.dispatchers) {
        this.dispatcher.addChild(dp);
      }
    }
  }

  async initialize() {
    const { default: settings }: { default: Module } = await import(
      `${modulesDir}/core/settings/index.js`
    );
    for (const dp of settings.dispatchers) {
      this.dispatcher.addChild(dp);
    }
  }
}

let apiId: number = parseInt(process.env.API_ID!);
let apiHash: string = process.env.API_HASH!;
const sessionStringsDir: string = join(cwd(), "sessions", "tg");
const recentSessionDir: string = join(sessionStringsDir, "recent.txt");

const saveRecentSession = (sessionString: string) => {
  try {
    writeFileSync(recentSessionDir, sessionString, "utf8");
  } catch (err) {
    console.error("Error writing recent session file:", err);
  }
};

const getRecentSession = (): string => {
  try {
    if (existsSync(recentSessionDir)) {
      const data = readFileSync(recentSessionDir, "utf8");
      return data.trim();
    }
  } catch (err) {
    console.error("Error reading recent session file:", err);
  }
  return "";
};

const createNewSession = async (): Promise<string> => {
  const { sessionName, id, hash } = await inquirer.prompt([
    {
      type: "input",
      name: "sessionName",
      message: "Enter session name:",
    },
    {
      type: "input",
      name: "id",
      message: "Enter API ID:",
    },
    {
      type: "input",
      name: "hash",
      message: "Enter API Hash:",
    },
  ]);
  apiId = parseInt(id);
  apiHash = hash;
  return sessionName;
};

const deleteSession = async () => {
  const sessionStrings = readdirSync(sessionStringsDir)
    .filter((file) => file.endsWith(".session"))
    .map((file) => parse(file).name)
    .sort();

  let { session } = await inquirer.prompt([
    {
      type: "list",
      name: "session",
      message: "Select a session string to delete:",
      choices: sessionStrings,
    },
  ]);

  session = join(sessionStringsDir, `${session}.session`);
  try {
    if (existsSync(session)) {
      unlinkSync(session);
    }
  } catch (err) {
    console.error("Error deleting session file:", err);
  }

  selectSession();
};

const selectSession = async (): Promise<string> => {
  const sessionStrings = readdirSync(sessionStringsDir)
    .filter((file) => file.endsWith(".session"))
    .map((file) => parse(file).name)
    .sort();

  let options = sessionStrings.slice();

  const recentSession = getRecentSession();
  if (recentSession) {
    const recentSessionIndex = sessionStrings.indexOf(recentSession);
    if (recentSessionIndex !== -1) {
      options.splice(recentSessionIndex, 1);
      options.unshift(recentSession);
    }
  }

  options.unshift("Delete session");
  options.unshift("Create new session");

  let { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Select a session string:",
      choices: options,
      default: 2,
    },
  ]);

  if (choice === "Create new session") {
    console.log("\x1Bc");
    choice = await createNewSession();
  }
  if (choice === "Delete session") {
    console.log("\x1Bc");
    let { session } = await inquirer.prompt([
      {
        type: "list",
        name: "session",
        message: "Select the session you want to delete:",
        choices: sessionStrings,
      },
    ]);
    session = join(sessionStringsDir, `${session}.session`);
    try {
      if (existsSync(session)) {
        unlinkSync(session);
      }
    } catch (err) {
      console.error("Error deleting session file:", err);
    }
    console.log("\x1Bc");
    await selectSession();
  }
  saveRecentSession(choice);

  return `sessions/tg/${choice}.session`;
};

const app = new Bot({
  storage: await selectSession(),
  apiId: apiId,
  apiHash: apiHash,
  logLevel: 0,
});

const modules: Module[] = await getModules([
  `${modulesDir}/extra`,
  `${modulesDir}/core`,
  `${modulesDir}/debug`,
]);
await app.importModules(modules);

app.run(
  {
    phone: () =>
      app.input("Enter phone number or leave blank to use bot token. > "),
    code: () => app.input("Code > "),
    password: () => app.input("Password > "),
    botToken: () => app.input("Bot token > "),
  },
  async (self) => {
    await app.initialize();
    console.log(`Logged in as ${self.displayName}`);
  }
);
