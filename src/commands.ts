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

        let latency = new Date().getMilliseconds() - start.getMilliseconds();

        str += `${n} messages`;
        str += ` (took ${latency}ms)`
        ctx.world.bot.chat(str, ctx.message.location);
    });
}

function about(ctx: cpr.CommandParserContext) {
    ctx.world.bot.chat(
        "owot_ws_log is Lemuria's chat logger. "
        + "Smile, your message is now in my database!"
    );
}

function help(ctx: cpr.CommandParserContext) {
    ctx.world.bot.chat(commandList());
}

export function commandList(): string {
    let str = `commands (${COMMANDS_LIST.length}): `;
    str += COMMANDS_LIST.map(c => c.name + ', ').join(' ').slice(0, -2);
    return str;
}

export const COMMANDS_LIST: cpr.Command[] = [
    { func: size, name: "size" },
    { func: about, name: "about" },
    { func: help, name: "help" }
];
