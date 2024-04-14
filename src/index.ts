import { TelegramClient } from "@mtcute/node";
import { Dispatcher } from "@mtcute/dispatcher";
import dotenv from "dotenv";
import { readdirSync } from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Module } from "./modules";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const modulesDir = `${__dirname}/modules`;

dotenv.config();

class Bot extends TelegramClient {
    private modules: Module[] = [];

    async importModules(dp: Dispatcher) {
        const folders = readdirSync(modulesDir, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
            .map((dirent) => dirent.name);

        for (const folder of folders) {
            const { default: module }: { default: Module } = await import(`${modulesDir}/${folder}/index.js`);
            this.modules.push(module);
            for (const dispatcher of module.dispatchers) {
                dp.addChild(dispatcher);
            }
        }
    }

}

const apiId: number = parseInt(process.env.API_ID!);
const apiHash: string = process.env.API_HASH!;
const sessionName: string = process.env.SESSION_NAME!;

const app = new Bot({
    storage: `sessions/${sessionName}.session`,
    apiId: apiId,
    apiHash: apiHash,
    logLevel: 0
});

const dp = Dispatcher.for(app)

await app.importModules(dp);

await app.run({
    phone: () => app.input('Enter phone number or leave blank to use bot token. > '),
    code: () => app.input('Code > '),
    password: () => app.input('Password > '),
    botToken: () => app.input('Bot token > '),
}, async (self) => {
    console.log(`Logged in as ${self.displayName}`)
})



/*
export const tg: TelegramClient = new TelegramClient({
    storage: 'sessions/bot.session',
    apiId: apiId,
    apiHash: apiHash,
    logLevel: 0
});

export const dp = Dispatcher.for(tg)


async function importModules() {
    const folders = readdirSync(modulesDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
        .map((dirent) => dirent.name);

    for (const folder of folders) {
        const files = readdirSync(`${modulesDir}/${folder}`, { withFileTypes: true })
            .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".js"));
        
        for (const file of files) {
            const { default: dispatcher } = await import(`${modulesDir}/${folder}/${file.name.slice(0, -3)}.js`);
            dp.addChild(dispatcher);
        }
    }
}

await importModules();

tg.run({
    phone: () => tg.input('Enter phone number or leave blank to use bot token. > '),
    code: () => tg.input('Code > '),
    password: () => tg.input('Password > '),
    botToken: () => tg.input('Bot token > '),
}, async (self) => {
    console.log(`Logged in as ${self.displayName}`)
})*/