import { ChatDB } from "./Database";
import { World } from "./World"
import { log } from "./app_winston";
import { cmdArgs } from "./types/cmdArgs";
import { config } from "./types/config";

interface Worlds {
    [key: string]: World
}

export class Logger {
    worlds: Worlds = {};
    worldReceivingGlobal: string | null;
    db: ChatDB;
    cliArgs: cmdArgs;

    constructor(allArgs: config) {
        this.worlds = {};
        this.worldReceivingGlobal = null;
        this.cliArgs = allArgs.cliArgs;
        this.db = new ChatDB(allArgs.clickhouse);
    }

    async init() {
        await this.db.connect();
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
        this.worlds[world].on("disconnected", () => {
            this.join(world);
        });
        this.worlds[world].on("message", (dataObj) => {
            if (!this.cliArgs.debug) {
                this.db.logMsg(dataObj);
            }
        });

        log.info(
            `connecting to: '${world}' -- ${srg ? `will receive global`
                : `will not receive global`}`
        );
    }
}

