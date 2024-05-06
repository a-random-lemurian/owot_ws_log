import * as clickhouse from "@depyronick/clickhouse-client";
import { ChatMessage } from "./types/chatMessage";
import { WorldMessageData } from "./types/WorldMessageData";
import { log } from "./app_winston";
import { inspect } from "util";

export interface ClickhouseConnDetails {
    host: string
    username: string
    password: string
    database: string
}

export async function initClickHouseClient(
    credentials: ClickhouseConnDetails
): Promise<clickhouse.ClickHouseClient> {
    const client = new clickhouse.ClickHouseClient(credentials);

    log.info('Initialized a new ClickHouse client, will attempt to check functionality')
    log.info('Pinged the ClickHouse server');
    if (!(client.ping())) {
        log.error("Connection failure!")
        throw new Error('Failed to ping ClickHouse!');
    }
    log.info('ClickHouse server pinged us back, good to go');
    return client;
};

type chatCountRow = {
    c: string
}[]

export class ChatDB {
    client: clickhouse.ClickHouseClient | null;
    credentials: ClickhouseConnDetails;

    constructor(ccd: ClickhouseConnDetails) {
        this.client = null;
        this.credentials = ccd;
    }

    async connect() {
        this.client = await initClickHouseClient(this.credentials);
    }

    msgCount(cb: (n: number) => void) {
        this.client?.queryPromise("select count(*) as c from chat_message").then((h) => {
            cb(parseInt(h[0]['c'], 10));
        });
    }

    logMsg(wmd: WorldMessageData) {
        if (!this.client) {
            log.error(`Attempting to insert a row when the database is not ready yet!`);
            return;
        }

        this.client.insertPromise('chat_message', [{
            ...wmd.message,
            world: wmd.worldName
        }])
            .then(() => {
                log.silly("Successfully inserted the row!")
            })
            .catch((err) => {
                log.error("!!! CLICKHOUSE FAILURE !!! --- " + err);
                log.error(inspect(wmd));
            });
    }
}
