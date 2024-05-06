import { log } from "./app_winston";
import * as cpr from "./CommandParser";
import { ChatLocation } from "simple-owot-bot";

function size(ctx: cpr.CommandParserContext) {
    log.info("User requested chat message count");

    ctx.db.msgCount((n) => {
        let str = ``;

        if (ctx.worldName = '' && ctx.message.location == ChatLocation.Page) {
            str += `/tell ${ctx.message.id} `;
        }

        str += `${n} messages`;
        ctx.world.bot.chat(str, ctx.message.location);
    });
}

export const COMMANDS_LIST: cpr.Command[] = [
    {func: size, name: "size"}
];
