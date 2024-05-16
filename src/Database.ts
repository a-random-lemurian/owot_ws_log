import * as clickhouse from "@depyronick/clickhouse-client";
import { ChatMessage } from "./types/chatMessage";
import { WorldMessageData } from "./types/WorldMessageData";
import { log as awlog } from "./app_winston";
import { inspect } from "util";

export interface ClickhouseConnDetails {
    host: string
    username: string
    password: string
    database: string
}

const log = awlog.child({ moduleName: "ChatDB" });

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

    async lastSeen(user: string) {
        const rows = await this.client?.queryPromise(
            "select * from chat_message where realUsername = {user:String}"
            + " order by date desc limit 1",
            { user: user }
        );
        return rows;
    }

    async lastSeenCheckOpt(user: string): Promise<{
        found: boolean; consent: boolean;
    }> {
        const rows = await this.client?.queryPromise(
            "select * from lastseen_optin where realUsername = {user:String}",
            { user: user }
        );
        if (!rows || rows.length == 0) {
            return { found: false, consent: true };
        }
        return { found: true, consent: rows[0].optin}
    }

    async lastSeenSetOpt(user: string, optin: boolean) {
        const rows = await this.client?.queryPromise(
            "select * from lastseen_optin where realUsername = {user:String}",
            { user: user }
        );
        console.log(rows);

        if (rows!.length != 0) {
            // They already have their status set, run an update query.
            this.client?.queryPromise("ALTER TABLE lastseen_optin "
                + "UPDATE optin = {opt:Boolean} "
                + "WHERE  realUsername = {user:String}",
                { user: user, opt: +optin }
            )
        } else {
            // They haven't chosen their status yet.
            this.client?.insertPromise('lastseen_optin', [{
                realUsername: user,
                optin: optin
            }]);
        }
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
