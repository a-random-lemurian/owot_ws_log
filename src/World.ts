import * as SOB from "simple-owot-bot";
import { OwotWS } from "./owotchat/OwotWS";
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
    bot: OwotWS;

    pingIntervalId: NodeJS.Timeout;

    constructor(
        name: string,
        mayReceiveGlobal: boolean) {
        super();

        this.name = name;
        this.mayReceiveGlobal = mayReceiveGlobal;
        this.bot = new OwotWS(createOWOTurl(name));

        let connectionAttempts = 0;
        while (true) {
            try {
                connectionAttempts++
                log.info(`Connection attempt ${connectionAttempts}`)
                this.bot.connect()
                break;
            } catch (e) {
                log.error(`Error: ${e}`)
            }
        }

        this.pingIntervalId = setInterval(async () => {
            try {
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
            } catch (error) {
                log.error(`${this.name} - Ping failed: ${error}`);
                this.reportDisconnect();
            }
        }, 60000);        

        this.bot.on("connected", () => {
            log.info(`Connected to '${name}'`);
        });

        this.bot.on("message_chat", (m) => {
            if (!this.mayReceiveGlobal && m.location == SOB.ChatLocation.Global) {
                return;
            }

            // Send message back to the parent Logger
            this.emit('message', {
                'message': m,
                'worldName': this.name
            })
        });

        this.bot.on("disconnected", () => {
            this.reportDisconnect();
        });
    }

    ping(): Promise<PingResult> {
        return new Promise((resolve, reject) => {
            this.bot.ping().then(n => {
                resolve({ ms: n, connected: true });
            });
            setTimeout(() => {
                reject("ping timeout")
            }, 30000);
        })
    }

    reportDisconnect() {
        log.warn(`disconnected from ${this.name}`);
        this.emit('disconnected', this.name);
        this.cleanup();
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
        this.bot.close();
        this.removeAllListeners();
        clearInterval(this.pingIntervalId);
    }
}
