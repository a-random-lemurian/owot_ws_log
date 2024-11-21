import * as cpr from "../CommandParser";

export function thiguka_word(ctx: cpr.CommandParserContext) {
    ctx.chat(ctx.thiguka!.randomEntryText());
}

export function thiguka(ctx: cpr.CommandParserContext) {
    ctx.chat("Thiguka, a constructed language by Lemuria, is at /thigukalang (though documentation is not complete). As for /thiguka - someone namesniped it. | GitHub: <https://github.com/thiguka>");
}
