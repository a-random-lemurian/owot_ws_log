import { log } from "./app_winston";
import * as cpr from "./CommandParser";
import { ChatLocation } from "simple-owot-bot";
import { ChatMessage } from "./types/chatMessage";

function size(ctx: cpr.CommandParserContext) {
    log.info("User requested chat message count");

    const start = new Date();

    ctx.db.msgCount((n) => {
        let str = ``;

        if (ctx.worldName = '' && ctx.message.location == ChatLocation.Page) {
            str += `/tell ${ctx.message.id} `;
        }

        const end = new Date();
        let latency = end.getMilliseconds();
        - start.getMilliseconds();

        str += `${n} messages`;
        str += ` (took ${latency}ms)`
        ctx.world.bot.chat(str, ctx.message.location);
    });
}

function about(ctx: cpr.CommandParserContext) {
    ctx.world.bot.chat(
        "owot_ws_log is Lemuria's chat logger. "
        + "Smile, your message is now in my database!",
        ctx.message.location
    );
}

function help(ctx: cpr.CommandParserContext) {
    let str = commandList();
    if (ctx.args[0]) {
        let cmd = COMMANDS_LIST.find(c => c.name === ctx.args[0]);
        if (!cmd) {
            str = `Error: command not found`;
        }
        else {
            str = `${ctx.prefix} ${cmd.name} - ${cmd.helpInfo || '(no help text)'}`;
        }
    }

    send:
    ctx.world.bot.chat(str, ctx.message.location);
}

// TODO: cache the optouts in memory, skipping a trip to the DB

// TODO: stop repeating "ctx.message.location" over and over again
// and add a function to the World object or something or make `ctx` a
// class and add wrappers or something idk

const NO_LASTSEEN_FOR_ANONS =
    `The 'ch lastseen' command does not store data on anonymous users.`;

function isRegistered(message: ChatMessage) {
    return message.registered;
}

async function lastseen(ctx: cpr.CommandParserContext) {
    if (ctx.args[0].match(/^\d+$/)) {
        ctx.world.bot.chat(NO_LASTSEEN_FOR_ANONS, ctx.message.location);
        return;
    }

    if (!await ctx.db.lastSeenCheckOpt(ctx.args[0]!)) {
        ctx.world.bot.chat(`${ctx.args[0]} has opted out of 'ch lastseen'.`, ctx.message.location);
        return;
    }

    const resp = await ctx.db.lastSeen(ctx.args[0]!);

    log.info(resp);

    if (resp?.length == 0) {
        ctx.world.bot.chat(`${ctx.args[0]} is not in the database.`, ctx.message.location);
        return;
    }

    //lsm: [L]ast [s]een [m]essage
    const lsm: ChatMessage = resp![0];
    ctx.world.bot.chat(`${lsm.realUsername} was last seen at ` +
        `${lsm.date} UTC`, ctx.message.location);
}

function lastseen_optout(ctx: cpr.CommandParserContext) {
    if (!isRegistered(ctx.message)) {
        ctx.world.bot.chat(NO_LASTSEEN_FOR_ANONS + ` You're always opted out.`, ctx.message.location);
        return;
    }

    ctx.db.lastSeenSetOpt(ctx.message.realUsername!, false);
    ctx.world.bot.chat(
          `You have been opted-out of 'ch lastseen'. | `
        + `"Your data gets exposed. You know you are at risk." - OWOT Wiki Privacy Policy`,
        ctx.message.location
    );
}

function lastseen_optin(ctx: cpr.CommandParserContext) {
    if (!isRegistered(ctx.message)) {
        ctx.world.bot.chat(NO_LASTSEEN_FOR_ANONS + ` You're always opted in.`, ctx.message.location);
        return;
    }

    ctx.db.lastSeenSetOpt(ctx.message.realUsername!, true);
    ctx.world.bot.chat(
        `You have opted back into 'ch lastseen'.`,
        ctx.message.location
    );
}

export function commandList(): string {
    let str = `commands (${COMMANDS_LIST.length}): `;
    str += COMMANDS_LIST.map(c => c.name + ', ').sort().join('').slice(0, -2);
    return str;
}

function version(ctx: cpr.CommandParserContext) {
    let str = ``;
    if (!ctx.lastCommit) {
        str += `no git version information`
    } else {
        str += `${ctx.lastCommit.hash.substring(0, 12)} - date: `;
        str += `${new Date(parseInt(ctx.lastCommit.authoredOn) * 1000)}`;
    }

    ctx.world.bot.chat(str, ctx.message.location);
}

export const COMMANDS_LIST: cpr.Command[] = [
    { func: size, name: "size", helpInfo: "Total amount of chat messages" },
    { func: about, name: "about", helpInfo: "Basic bot information" },
    { func: help, name: "help", helpInfo: "Command list" },
    { func: version, name: "version", helpInfo: "Git commit information" },
    { func: lastseen, name: "lastseen", helpInfo: "See when a user last chatted" },
    { func: lastseen_optout, name: "lastseen-optout", helpInfo: "Opt-out of ch lastseen" },
    { func: lastseen_optin, name: "lastseen-optin", helpInfo: "Opt back into ch lastseen" }
];
