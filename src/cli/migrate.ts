/**
 * migrate from the old SQLite3-based logger to the new clickhouse-based one
 */
import * as sqlite3 from "sqlite3";
import * as cmdr from "commander";
import { ClickHouseClient } from '@depyronick/clickhouse-client';
import { initClickHouseClient } from "../Database";

let s = 0;

interface OldDataRow {
    msg_json: string,
    metadata_json: string
};

enum ChatLocation {
    "page", "global"
};

enum PrivMsgType {
    "from_me", "to_me"
};

interface MsgJson {
    kind: string,
    nickname: string,
    realUsername: string,
    id: number,
    message: string,
    registered: boolean,
    location: ChatLocation,
    op: boolean,
    admin: boolean,
    staff: boolean,
    color: string,
    date: number,
    privateMessage?: PrivMsgType
};

interface MetadataJson {
    msg_json_sha256: string,
    received: string,
    world: string,
    sent_by_bot?: boolean,
    starianna: {
        nickname: boolean,
        message: boolean
    }
};

/*
create table chat_message (
    date DateTime64(3, 'UTC') PRIMARY KEY,
    nickname String,
    realUsername String,
    id UInt32,
    message String,
    registered Boolean,
    location Enum('page' = 1, 'global' = 2),
    op Boolean,
    admin Boolean,
    staff Boolean,
    color String,
    privateMessage Nullable(Enum8('' = 1, 'from_me' = 2, 'to_me' = 3)),

    -- bot specific meta fields --
    world String,
    sentByBot Boolean
    metadataJson JSON,
);
 */

import { anti_starianna } from "../anti-starianna";
import { ClickhouseConnDetails } from "../Database";

function prepare_for_clickhouse(m: OldDataRow) {
    let msg_json: MsgJson = JSON.parse(m.msg_json);
    let meta: MetadataJson = JSON.parse(m.metadata_json);

    // ds = destariannafied
    let nickname_ds = anti_starianna(msg_json.nickname);
    let message_ds = anti_starianna(msg_json.message);

    meta.starianna = {
        nickname: nickname_ds.starianna,
        message: message_ds.starianna
    }

    return {
        date: msg_json.date,
        nickname: nickname_ds.text,
        realUsername: msg_json.realUsername,
        id: msg_json.id,
        message: message_ds.text,
        registered: msg_json.registered,
        location: msg_json.location,
        op: msg_json.op,
        admin: msg_json.admin,
        staff: msg_json.staff,
        color: msg_json.color,
        privateMessage: msg_json.privateMessage || '',
        world: meta.world,
        sentByBot: meta.sent_by_bot,
        metadataJson: meta
    };
}

export type MigrateFuncArgsObj = {
    clickhouse: ClickhouseConnDetails,
    oldSqliteFile: string
}

export async function migrate(args: MigrateFuncArgsObj) {
    const client = await initClickHouseClient(args.clickhouse);

    let rows: any[] = [];

    const db: sqlite3.Database = new sqlite3.Database(args.oldSqliteFile);
    db.each("SELECT * FROM msg", [], async (err, row: OldDataRow) => {
        if (err) {
            throw err;
        }

        rows.push(prepare_for_clickhouse(row));

    }).wait(() => {
        client.insertPromise('chat_message', rows)
            .then(() => {
                console.log('Migration is complete!')
            })
            .catch((err: any) => {
                console.log(err)
            });
    });

}
