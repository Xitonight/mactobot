import { TelegramClient } from "@mtcute/node";
import { Dispatcher } from "@mtcute/dispatcher";
import dotenv from "dotenv";
import { readdirSync } from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const modulesDir = `${__dirname}/modules`;

console.log(__dirname);
console.log(__filename);
console.log(modulesDir);
dotenv.config();

const apiId: number = parseInt(process.env.API_ID!);
const apiHash: string = process.env.API_HASH!;
const botToken: string = process.env.BOT_TOKEN!;

export const tg: TelegramClient = new TelegramClient({
    storage: 'sessions/botterello.session',
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
            .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".ts"));
        
        for (const file of files) {
            const { default: dispatcher } = await import(`${modulesDir}/${folder}/${file.name.slice(0, -3)}.js`);
            dp.addChild(dispatcher);
        }
    }
}

await importModules();

tg.run({
    botToken: botToken
    // phone: () => tg.input('Phone > '),
    // code: () => tg.input('Code > '),
    // password: () => tg.input('Password > ')
}, async (self) => {
    console.log(`Logged in as ${self.displayName}`)
})