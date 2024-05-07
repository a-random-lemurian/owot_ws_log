import { ChatDB } from "./Database";
import { World } from "./World";
import { ChatMessage } from "./types/chatMessage";
import * as glc from "git-last-commit";

export interface CommandParserContext {
    message: ChatMessage,
    args: string[],
    worldName: string,
    world: World,
    db: ChatDB,
    lastCommit: glc.Commit | undefined,
    prefix: string
}

export interface CommandParserConfiguration {
    prefix: string
}

enum CommandRestriction {
    // Only allows users in trustedUsers, in the config.json
    TrustedUsersOnly
}

export interface Command {
    func: (ctx: CommandParserContext) => void;
    restrictions?: CommandRestriction[];
    name: string;
    helpInfo?: string;
}

export class CommandParser {
    commands: { [key: string]: Command };
    prefix: string;

    constructor(cfg: CommandParserConfiguration) {
        this.commands = {};
        this.prefix = cfg.prefix;
    }

    /*
     * Do not add the prefix, nor should the command names have spaces!
     */
    registerCommand(cmd: Command) {
        this.commands[cmd.name] = cmd;
    }

    executeCommand(ctx: CommandParserContext) {
        const args = ctx.message.message.split(' ');
        ctx.args = args.splice(2);
        ctx.prefix = this.prefix;
        if (this.commands[args[1]]) {
            this.commands[args[1]].func(ctx);
        }
    }
}
