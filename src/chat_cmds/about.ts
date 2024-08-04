import * as cpr from "../CommandParser";

export function about(ctx: cpr.CommandParserContext) {
    ctx.chat(
        "owot_ws_log is Lemuria's chat logger. "
        + "Smile, your message is now in my database!"
    );
}
