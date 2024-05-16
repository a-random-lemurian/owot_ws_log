import { ChatDB } from "./Database";
import { World } from "./World";
import { log as awlog } from "./app_winston";
import { ChatMessage } from "./types/chatMessage";
import * as glc from "git-last-commit";

const log = awlog.child({ moduleName: "CommandParser" });

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
    trustedUsers: string[],
    nickname: string
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
    trustedUsers: string[];
    nickname: string

    constructor(cfg: CommandParserConfiguration) {
        this.commands = {};
        this.prefix = cfg.prefix;
        this.trustedUsers = cfg.trustedUsers;
        this.nickname = cfg.nickname;
    }

    /*
     * Do not add the prefix, nor should the command names have spaces!
     */
    registerCommand(cmd: Command) {
        this.commands[cmd.name] = cmd;
    }

    canRunCommand(cmd: Command, ctx: CommandParserContext) {
        if (!cmd.restrictions) return true;
        if (!ctx.trustedUsers) return false;
        if (CommandRestriction.TrustedUsersOnly in cmd.restrictions) {
            if (ctx.trustedUsers!.includes(ctx.message.realUsername!)) {
                return true;
            }
        }
        log.warn(`User does not have permission to run ch ${cmd.name}` +
            ` -- ignoring command.`
        + ` -- trusted user list: ${ctx.trustedUsers}`);
        return false;
    }

    executeCommand(ctx: CommandParserContext) {
        const args = ctx.message.message.split(' ');
        ctx.args = args.splice(2);
        ctx.prefix = this.prefix;
        ctx.trustedUsers = this.trustedUsers;
        ctx.chat = (message) => {
            ctx.world.bot.chat(
                message, ctx.message.location, this.nickname
            );
        }

        const cmd = this.commands[args[1]];
        if (cmd && this.canRunCommand(cmd, ctx)) {
            this.commands[args[1]].func(ctx);
        }
    }
}
