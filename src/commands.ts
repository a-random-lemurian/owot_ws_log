import { log } from "./app_winston";
import * as cpr from "./CommandParser";
import { ChatLocation } from "simple-owot-bot";

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
            - ctx.message.date.getMilliseconds();
        let dbLatency = end.getMilliseconds();
            - start.getMilliseconds();

        str += `${n} messages`;
        str += ` (took ${latency}ms - db time ${dbLatency}ms)`
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
    { func: version, name: "version", helpInfo: "Git commit information" }
];
