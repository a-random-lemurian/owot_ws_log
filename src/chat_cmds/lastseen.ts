import { log } from "../app_winston";
import * as cpr from "../CommandParser";
import { ChatLocation } from "../owotchat/OwotWS";
import * as chsize from "../chatMessageCount"
import { ChatMessage } from "../types/chatMessage";

const NO_LASTSEEN_FOR_ANONS =
    `The 'ch lastseen' command does not store data on anonymous users.`;

function isRegistered(message: ChatMessage) {
    return message.registered;
}

export async function lastseen(ctx: cpr.CommandParserContext) {
    const start = Date.now();

    if (ctx.args.length === 0) {
        ctx.chat(`You need to specify an OWOT username to check.`);
        return;
    }

    if (ctx.args[0].match(/^\d+$/)) {
        ctx.chat(NO_LASTSEEN_FOR_ANONS);
        return;
    }

    if (!await ctx.db.lastSeenCheckOpt(ctx.args[0]!)) {
        ctx.chat(`${ctx.args[0]} has opted out of 'ch lastseen'.`);
        return;
    }

    const resp = await ctx.db.lastSeen(ctx.args[0]!);

    log.info(JSON.stringify(resp));

    if (resp?.length == 0) {
        ctx.chat(`${ctx.args[0]} is not in the database.`);
        return;
    }

    const end = Date.now();
    const latency = end - start;
    const totalLatency = end - ctx.message.date;

    //lsm: [L]ast [s]een [m]essage
    const lsm: ChatMessage = resp![0];
    ctx.chat(`${lsm.realUsername} was last seen at ${lsm.date} UTC `
        + `(latency: db ${latency}ms, total ${totalLatency}ms)`);
}

export function lastseen_optout(ctx: cpr.CommandParserContext) {
    if (!isRegistered(ctx.message)) {
        ctx.chat(NO_LASTSEEN_FOR_ANONS + ` You're always opted out.`);
        return;
    }

    ctx.db.lastSeenSetOpt(ctx.message.realUsername!, false);
    ctx.chat(
        `You have been opted-out of 'ch lastseen'. | `
        + `"Your data gets exposed. You know you are at risk." - OWOT Wiki Privacy Policy`
    );
}

export function lastseen_optin(ctx: cpr.CommandParserContext) {
    if (!isRegistered(ctx.message)) {
        ctx.chat(NO_LASTSEEN_FOR_ANONS + ` You're always opted in.`);
        return;
    }

    ctx.db.lastSeenSetOpt(ctx.message.realUsername!, true);
    ctx.chat(`You have opted back into 'ch lastseen'.`);
}
