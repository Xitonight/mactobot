import { Dispatcher, filters } from "@mtcute/dispatcher";
import { md } from "@mtcute/markdown-parser";
import { Module } from "..";

const dp = Dispatcher.child();

dp.onNewMessage(filters.command(["id", "messageid"]) , async (ctx) => {
    if (ctx.replyToMessage) {
        await ctx.replyText(`__**Message id:**__ ${ctx.replyToMessage.id}`);
    } else {
        await ctx.replyText(md`❌ You have to **reply** to a message to get its id!`);
    }
});

dp.onNewMessage(filters.command(["userid", "uid"]), async (ctx) => {
    if (ctx.replyToMessage) {
        await ctx.replyText(md`__**User id:**__ ${await ctx?.getReplyTo().then((msg) => msg?.sender.id)}`);
    } else {
        await ctx.replyText(md`__**User id:**__ ${ctx.sender.id}`);
    }
});

dp.onNewMessage(filters.command(["chatid", "cid"]), async (ctx) => {
    await ctx.replyText(md`__**Chat id:**__ \`${ctx.chat.id}\``);
});

dp.onNewMessage(filters.command(["fileid", "fid"]), async (ctx) => {
    const reply = await ctx.getReplyTo();

    if (!reply) {
        await ctx.replyText(md`❌ You have to **reply** to a message with a media to get its file_id!`);
        return;
    }

    if (reply.text){
        await ctx.replyText(md`❌ **Text** messages don't have a file_id!`);
        return;
    }

    if (reply.media?.type === "audio" || reply.media?.type === "document" || 
        reply.media?.type === "photo" || reply.media?.type === "video" || 
        reply.media?.type === "voice" || reply.media?.type === "sticker") {
        await ctx.replyText(md`__**file_id**__: \`${reply.media.fileId}\``);
        return;
    }

});

const mod: Module  = {
    name: "Message Info",
    help: "Get info about messages, users, chats and files",
    dispatchers: [dp],
    type: "extra"
};

export default mod;