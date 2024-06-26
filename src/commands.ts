import { log } from "./app_winston";
import * as cpr from "./CommandParser";
import { ChatLocation } from "simple-owot-bot";
import { ChatMessage } from "./types/chatMessage";
import * as chsize from "./chatMessageCount"

function size(ctx: cpr.CommandParserContext) {
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

function about(ctx: cpr.CommandParserContext) {
    ctx.chat(
        "owot_ws_log is Lemuria's chat logger. "
        + "Smile, your message is now in my database!"
    );
}

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

// TODO: cache the optouts in memory, skipping a trip to the DB

const NO_LASTSEEN_FOR_ANONS =
    `The 'ch lastseen' command does not store data on anonymous users.`;

function isRegistered(message: ChatMessage) {
    return message.registered;
}

async function lastseen(ctx: cpr.CommandParserContext) {
    const start = Date.now();

    if (ctx.args.length === 0) {
        ctx.chat(`You need to specify an OWOT username to check.`);
        return;
    }

    if (ctx.args[0].match(/^\d+$/)) {
        ctx.chat(NO_LASTSEEN_FOR_ANONS);
        return;
    }

    if (!await ctx.db.lastSeenCheckOpt(ctx.args[0]!)) {
        ctx.chat(`${ctx.args[0]} has opted out of 'ch lastseen'.`);
        return;
    }

    const resp = await ctx.db.lastSeen(ctx.args[0]!);

    log.info(JSON.stringify(resp));

    if (resp?.length == 0) {
        ctx.chat(`${ctx.args[0]} is not in the database.`);
        return;
    }

    const end = Date.now();
    const latency = end - start;
    const totalLatency = end - ctx.message.date;

    //lsm: [L]ast [s]een [m]essage
    const lsm: ChatMessage = resp![0];
    ctx.chat(`${lsm.realUsername} was last seen at ${lsm.date} UTC `
        + `(latency: db ${latency}ms, total ${totalLatency}ms)`);
}

function lastseen_optout(ctx: cpr.CommandParserContext) {
    if (!isRegistered(ctx.message)) {
        ctx.chat(NO_LASTSEEN_FOR_ANONS + ` You're always opted out.`);
        return;
    }

    ctx.db.lastSeenSetOpt(ctx.message.realUsername!, false);
    ctx.chat(
        `You have been opted-out of 'ch lastseen'. | `
        + `"Your data gets exposed. You know you are at risk." - OWOT Wiki Privacy Policy`
    );
}

function lastseen_optin(ctx: cpr.CommandParserContext) {
    if (!isRegistered(ctx.message)) {
        ctx.chat(NO_LASTSEEN_FOR_ANONS + ` You're always opted in.`);
        return;
    }

    ctx.db.lastSeenSetOpt(ctx.message.realUsername!, true);
    ctx.chat(`You have opted back into 'ch lastseen'.`);
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

function version(ctx: cpr.CommandParserContext) {
    let str = ``;
    if (!ctx.lastCommit) {
        str += `no git version information`
    } else {
        str += `${ctx.lastCommit.hash.substring(0, 12)} - date: `;
        str += `${new Date(parseInt(ctx.lastCommit.authoredOn) * 1000)}`;
    }

    ctx.chat(str);
}

function traceback(ctx: cpr.CommandParserContext) {
    Error.stackTraceLimit = 1000;
    const err = new Error("Not an error, but stacktrace was requested.");
    console.log(err);
    log.info("Requested stacktrace is ready.");
    ctx.chat("Check the console for the stacktrace, Lemuria.")
}

const startTime = new Date()

function uptime(ctx: cpr.CommandParserContext) {
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

function thiguka_word(ctx: cpr.CommandParserContext) {
    ctx.chat(ctx.thiguka!.randomEntryText());
}

function thiguka(ctx: cpr.CommandParserContext) {
    ctx.chat("Thiguka, a constructed language by Lemuria, is at /thigukalang (though documentation is not complete). As for /thiguka - someone namesniped it. | GitHub: <https://github.com/thiguka>");
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
