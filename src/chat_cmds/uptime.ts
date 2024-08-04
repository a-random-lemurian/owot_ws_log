import * as cpr from "../CommandParser";

const startTime = new Date()

export function uptime(ctx: cpr.CommandParserContext) {
    function durationStr(startDate: Date, endDate: Date) {
        const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    ctx.chat(`uptime: ${startTime.toISOString()} - ${durationStr(startTime, new Date())}`)
}
