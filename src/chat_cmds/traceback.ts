import { log } from "../app_winston";
import * as cpr from "../CommandParser";

export function traceback(ctx: cpr.CommandParserContext) {
    Error.stackTraceLimit = 1000;
    const err = new Error("Not an error, but stacktrace was requested.");
    console.log(err);
    log.info("Requested stacktrace is ready.");
    ctx.chat("Check the console for the stacktrace, Lemuria.")
}