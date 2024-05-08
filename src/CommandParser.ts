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
    prefix: string,
    trustedUsers?: string[]

    chat: (message: string) => void;
}

export interface CommandParserConfiguration {
    prefix: string,
    trustedUsers: string[]
}

export enum CommandRestriction {
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

    canRunCommand(cmd: Command, ctx: CommandParserContext) {
        if (!cmd.restrictions) return true;
        if (CommandRestriction.TrustedUsersOnly in cmd.restrictions) {
            if (ctx.message.realUsername! in ctx.trustedUsers!) {
                return true;
            }
        }
        return false;
    }

    executeCommand(ctx: CommandParserContext) {
        const args = ctx.message.message.split(' ');
        ctx.args = args.splice(2);
        ctx.prefix = this.prefix;
        ctx.chat = (message) => {
            ctx.world.bot.chat(message, ctx.message.location);
        }

        const cmd = this.commands[args[1]];
        if (cmd && this.canRunCommand(cmd, ctx)) {
            this.commands[args[1]].func(ctx);
        }
    }
}
