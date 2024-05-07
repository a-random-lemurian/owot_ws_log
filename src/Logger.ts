import { ChatLocation } from "simple-owot-bot";
import { ChatDB } from "./Database";
import { World } from "./World";
import { WorldMessageData } from "./types/WorldMessageData";
import { log } from "./app_winston";
import { cmdArgs } from "./types/cmdArgs";
import { config } from "./types/config";
import { CommandParser } from "./CommandParser";
import * as glc from "git-last-commit";
import * as cmds from "./commands";

interface Worlds {
    [key: string]: World
}

export interface Ratelimit {
    refreshMs: number,
    triggered: boolean
}

export class Logger {
    worlds: Worlds = {};
    worldReceivingGlobal: string | null;
    db: ChatDB;
    cliArgs: cmdArgs;
    config: config;
    parser: CommandParser;
    lastCommit?: glc.Commit;
    cache: object;

    ratelimits: { [key: string]: Ratelimit } = {
        /*
         * TODO: possibly cache the number of chat messages
         */
        "size": { "refreshMs": 10, "triggered": false }
    }

    constructor(cfg: config) {
        this.config = cfg;
        this.worlds = {};
        this.worldReceivingGlobal = null;
        this.cliArgs = cfg.cliArgs;
        this.cache = {};
        this.db = new ChatDB(cfg.clickhouse);

        this.parser = new CommandParser({
            prefix: 'ch'
        });
        cmds.COMMANDS_LIST.forEach(cmd => {
            this.parser.registerCommand(cmd);
        });

        Object.keys(this.ratelimits).forEach((k: string) => {
            setInterval(
                (a: Ratelimit) => { a.triggered = false },
                this.ratelimits[k].refreshMs,
                this.ratelimits[k]
            )
        })
    }

    async init() {
        await this.db.connect();
        await glc.getLastCommit(async (err, commit) => {
            this.lastCommit = commit;
        });
    }

    /**
     * The bot should never designate '' as the global chat receiver,
     * as that world is prone to FP turning off the chat and thus
     * depriving the bot of its ability to log global chats.
     * 
     * `lemuria` is the preferred receiver, as it is a world under
     * Lemuria's control and will always have chat turned on.
     * 
     * @param world Name of the world.
     */
    shouldReceiveGlobal(world: string): boolean {
        // TODO: do not hardcode
        if (this.worldReceivingGlobal == 'lemuria') {
            return false;
        } else {
            if (world != '') {
                return true;
            }
        }

        return false;
    }

    join(world: string) {
        // srg: [s]hould[R]eceive[G]lobal
        let srg = this.shouldReceiveGlobal(world);
        if (srg) {
            this.worldReceivingGlobal = world;
        }

        this.worlds[world] = new World(world, srg);
        this.worlds[world].on("disconnected", (name) => {
            if (this.worldReceivingGlobal == name) { 
                this.worldReceivingGlobal = null;
            }
            this.worlds[world].cleanup();
            this.join(world);
        });
        this.worlds[world].on("message", (dataObj) => {
            if (!this.cliArgs.debug) {
                this.db.logMsg(dataObj);
            }
        });
        this.worlds[world].on("message", (dataObj) => {
            if (dataObj.message.message.startsWith('ch', 0)) {
                this.parser.executeCommand({
                    ...dataObj,
                    db: this.db,
                    lastCommit: this.lastCommit,
                    args: [],
                    prefix: '',
                    chat: () => { }
                });
            }
        });

        log.info(
            `connecting to: '${world}' -- ${srg ? `will receive global`
                : `will not receive global`}`
        );
    }
}

