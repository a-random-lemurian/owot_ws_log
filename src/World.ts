import * as SOB from "simple-owot-bot";
import { ChatMessage } from "./types/chatMessage";
import { PingResult } from "./types/PingResult";
import { log as awlog } from "./app_winston";
import { TypedEmitter } from "tiny-typed-emitter";
import { WorldMessageData } from "./types/WorldMessageData";

export function createOWOTurl(world: string): string {
    if (world == '') {
        return `wss://ourworldoftext.com/ws/?hide=1`;
    } else {
        return `wss://ourworldoftext.com/${world}/ws/?hide=1`;
    }
}

const log = awlog.child({ moduleName: "World" });

export interface WorldEvents {
    'disconnected': (worldName: string) => void;
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

        let i = setInterval(async () => {
            const result = await this.ping();
            if (!result.connected) {
                log.warn(`${this.name} - Ping timeout!`);
                this.reportDisconnect();
            } else {
                if (result.ms < 15000) {
                    return;
                }
                log.warn(
                      `${this.name} - possible weirdness in progress!`
                    + `server ping: ${result.ms} ms`
                );
            }
        }, 60000);

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
                'world': this,
                'worldName': this.name
            })
        });

        this.bot.on("disconnected", () => {
            this.reportDisconnect();
        });
    }

    ping(): Promise<PingResult> {
        return new Promise((resolve) => {
            this.bot.ping().then(n => {
                resolve({ ms: n, connected: true });
            });
            setTimeout(() => {
                resolve({ ms: 0, connected: false });
            }, 30000);
        })
    }

    reportDisconnect() {
        log.warn(`disconnected from ${this.name}`);
        this.emit('disconnected', this.name);
    }

    /*
     * simple-owot-bot could really use a disconnect function.
     *
     * Potential problem: Just overwriting connection objects when they are
     * disconnected MAY cause a pileup of old dead connection objects and
     * use all the RAM. Unsure if the JS garbage collector (if it has one
     * at all) will take care of it all.
     */
    cleanup() {
        this.bot.removeAllListeners();
    }
}
