import { log } from "./app_winston";
import * as cpr from "./CommandParser";

import { size } from "./chat_cmds/size"
import { lastseen, lastseen_optin, lastseen_optout } from "./chat_cmds/lastseen"
import { version } from "./chat_cmds/version";
import { about } from "./chat_cmds/about";
import { uptime } from "./chat_cmds/uptime";
import { traceback } from "./chat_cmds/traceback";
import { thiguka, thiguka_word } from "./chat_cmds/thiguka";

function help(ctx: cpr.CommandParserContext) {
    let str = commandList() + ` / *: Lemuria-only`;
    if (ctx.args[0]) {
        let cmd = COMMANDS_LIST.find(c => c.name === ctx.args[0]);
        if (!cmd) {
            str = `Error: command not found`;
        }
        else {
            str = `Command Help -- ${ctx.prefix} ${cmd.name} - ${cmd.helpInfo || '(no help text)'}`;
        }
    }

    send:
    ctx.chat(str);
}

export function commandList(): string {
    let str = `commands (${COMMANDS_LIST.length}): `;
    str += COMMANDS_LIST.map(c => {
        let str = ``;
        str += c.name;
        if (c.restrictions
            && cpr.CommandRestriction.TrustedUsersOnly
            in c.restrictions) {
            str += '*';
        }
        str += ', ';
        return str;
    }).sort().join('').slice(0, -2);
    return str;
}

function ffdr(ctx: cpr.CommandParserContext) {
    ctx.chat("<https://www.youtube.com/@FallingForDeadRosesGaming>");
}

function src(ctx: cpr.CommandParserContext) {
    ctx.chat("I'm open-source and MIT-licensed: <https://github.com/a-random-lemurian/owot_ws_log>");
}

function gallia(ctx: cpr.CommandParserContext) {
    ctx.chat("Gallia Kastner, known on Twitch as passagallia, is an American Twitch streamer and violinist based in Los Angeles, California. <https://galliakastnerviolin.com> <https://twitch.tv/passagallia>");
}

function gahlija(ctx: cpr.CommandParserContext) {
    ctx.chat("Gahlija Kastla, o passagallia ifil Telits, gulaya tegu-Arika Telitslisa alu fahgahlirithi ifil Los Algeleskala, Kaliforlijakala. <https://galliakastnerviolin.com> <https://twitch.tv/passagallia>");
}

function emily(ctx: cpr.CommandParserContext) {
    ctx.chat("Emily Anderson is an Alaskan singer-songwriter who lives in Los Angeles: <https://emilyandersonak.com>");
}

function nora(ctx: cpr.CommandParserContext) {
    ctx.chat("Nora Elise Proctor is a Lemurian OWOT user. She is the creator of owot_ws_log, the bot that keeps an eye on you. D9 hates her. On the other side of the fourth wall, he is Lemuria and Nora is just his roleplay name. Shhhh!");
}

export const COMMANDS_LIST: cpr.Command[] = [
    {
        func: gallia,
        name: "gallia",
        helpInfo: "You know who she is."
    },
    {
        func: gahlija,
        name: "gahlija",
        helpInfo: "Kakepah kala pothutay."
    },
    {
        func: size,
        name: "size",
        helpInfo: "Total amount of chat messages"
    },
    {
        func: emily,
        name: "emily",
        helpInfo: "Emily Anderson"
    },
    {
        func: nora,
        name: "nora",
        helpInfo: "Nora Elise Proctor"
    },
    {
        func: thiguka,
        name: "thiguka",
        helpInfo: "The Thiguka language"
    },
    {
        func: thiguka_word,
        name: "thiguka-word",
        helpInfo: "Random word"
    },
    {
        func: src,
        name: "src",
        helpInfo: "Link to the bot's source code"
    },
    {
        func: about,
        name: "about",
        helpInfo: "Basic bot information"
    },
    {
        func: help,
        name: "help",
        helpInfo: "Command list"
    },
    {
        func: version,
        name: "version",
        helpInfo: "Git commit information"
    },
    {
        func: lastseen,
        name: "lastseen",
        helpInfo: "See when a user last chatted"
    },
    {
        func: lastseen_optout,
        name: "lastseen-optout",
        helpInfo: "Opt-out of ch lastseen"
    },
    {
        func: lastseen_optin,
        name: "lastseen-optin",
        helpInfo: "Opt back into ch lastseen"
    },
    {
        func: ffdr,
        name: "ffdr",
        helpInfo: "Experience a rapid downward movement to please a group of"
            + " dead specimens of multiple species within the genus Rosa"
    },
    {
        func: traceback,
        name: "traceback",
        helpInfo: "Admin-only. Prints traceback on console.",
        restrictions: [
            cpr.CommandRestriction.TrustedUsersOnly
        ]
    },
    {
        func: uptime,
        name: "uptime",
        helpInfo: "How long has the bot been up?"
    }
];
