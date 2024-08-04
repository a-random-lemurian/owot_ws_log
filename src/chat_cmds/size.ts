import { log } from "../app_winston";
import * as cpr from "../CommandParser";
import { ChatLocation } from "../owotchat/OwotWS";
import * as chsize from "../chatMessageCount"

export function size(ctx: cpr.CommandParserContext) {
    log.info("User requested chat message count");

    function nanosecondsNow() {
        var hrTime = process.hrtime()
        return hrTime[0] * 1000000000 + hrTime[1];
    }

    const start = nanosecondsNow();
    const startMs = new Date().getTime()

    let n = chsize.getCount();
    let str = ``;

    if (ctx.worldName = '' && ctx.message.location == ChatLocation.Page) {
        str += `/tell ${ctx.message.id} `;
    }

    const end = nanosecondsNow();
    let latency = end - start;
    let totalLatency = new Date().getTime() - ctx.message.date;

    str += `${n} messages`;
    str += ` (latency: db ${latency}ns, total ${totalLatency}ms)`
    ctx.chat(str);
}
