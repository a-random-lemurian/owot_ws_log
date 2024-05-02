import * as SOB from "simple-owot-bot";
import { ChatMessage } from "./types/chatMessage";
import { log } from "./app_winston";
import { TypedEmitter } from "tiny-typed-emitter";

export function createOWOTurl(world: string): string {
    if (world == '') {
        return `wss://ourworldoftext.com/ws/?hide=1`;
    } else {
        return `wss://ourworldoftext.com/${world}/ws/?hide=1`;
    }
}

export interface WorldMessageData {
    message: ChatMessage,
    world: string
}

export interface WorldEvents {
    'disconnected': () => void;
    'message': (d: WorldMessageData) => void;
};

export class World extends TypedEmitter<WorldEvents> {
    name: string;
    mayReceiveGlobal: boolean;
    bot: SOB.Bot;

    constructor(
        name: string,
        mayReceiveGlobal: boolean) {
        super();

        this.name = name;
        this.mayReceiveGlobal = mayReceiveGlobal;
        this.bot = new SOB.Bot(createOWOTurl(name));

        this.bot.on("connected", () => {
            log.info(`Connected to '${name}'`);
        });

        this.bot.on("message_chat", (m) => {
            if (!this.mayReceiveGlobal && m.location == SOB.ChatLocation.Global) {
                return;
            }

            // Assemble human-readable string to send to output
            let str: string = '';
            str += `/${name} : `
            str += `{${m.location}} `
            str += `[${m.id}]`;
            if (m.admin) str += ' (admin)';
            if (m.registered) str += ` <${m.realUsername}>`;
            if (m.nickname) str += ` (${m.nickname})`;
            str += `: ${m.message}`;
            log.info(str);

            // Send message back to the parent Logger
            this.emit('message', {
                'message': m,
                'world': this.name
            })
        });

        this.bot.on("disconnected", () => {
            log.warn(`disconnected from ${this.name}`);
            this.emit('disconnected');
        });
    }
}
