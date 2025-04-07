import { TelegramClient } from "@mtcute/node";
import { Dispatcher, MemoryStateStorage } from "@mtcute/dispatcher";
import * as dotenv from "dotenv";
import { redis } from "./databases/redis.ts";
import { prisma, dp as defaults } from "./databases/prisma.ts";

import {
  Welcome,
  Goodbye,
  Start,
  Settings,
  Language,
  Unparse,
} from "./modules";
import { dp as test, dp1 as test1, scene } from "../test/scenes.ts";

dotenv.config();

const tg = new TelegramClient({
  apiId: Number(process.env.API_ID),
  apiHash: `${process.env.API_HASH}`,
  storage: "storage/bot",
});

const dp = Dispatcher.for<any>(tg, { storage: new MemoryStateStorage() });
const modules = [Welcome, Goodbye, Start, Settings, Language, Unparse];

for (const mod of modules) {
  for (const dispatcher of Object.values(mod.dispatchers)) {
    dp.extend(dispatcher);
  }
}

dp.extend(defaults);
dp.extend(test);
dp.extend(test1);

dp.addScene(scene);

async function startBot() {
  const self = await tg.start({
    botToken: process.env.BOT_TOKEN!,
  });

  console.log(`Bot started as ${self.username}`);

  // Graceful shutdown handling
  process.on("SIGINT", async () => {
    console.log("Shutting down...");
    await prisma.$disconnect();
    await redis.disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("Shutting down...");
    await prisma.$disconnect();
    await redis.disconnect();
    process.exit(0);
  });
}

startBot().catch(async (error) => {
  console.error("Error starting bot:", error);
  await prisma.$disconnect();
  await redis.disconnect();
  process.exit(1);
});
