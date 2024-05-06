import { ChatDB } from "./Database";
import { World } from "./World";
import { ChatMessage } from "./types/chatMessage";

export interface CommandParserContext {
    message: ChatMessage,
    args?: string[],
    worldName: string,
    world: World,
    db: ChatDB
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
}

export class CommandParser {
    commands: { [key: string]: Command };

    constructor(cfg: CommandParserConfiguration) {
        this.commands = {};
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
        if (this.commands[args[1]]) {
            this.commands[args[1]].func(ctx);
        }
    }
}
