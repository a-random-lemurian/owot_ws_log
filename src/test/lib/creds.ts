/* Utility function for retrieving Clickhouse credentials. */
import { ClickhouseConnDetails } from "../../Database";
import { config } from "../../types/config";
import { log as awlog } from "../../app_winston";
import * as fs from "fs";

const log = awlog.child({ moduleName: "test.lib.creds" });
const CONFIG_FILE_NAME = "config.json";
const MSG_NO_CLICKHOUSE = "Could not find ClickHouse credentials in config";
const MSG_NO_CONFIG = "Could not read config file.";

export function getCredentials(): ClickhouseConnDetails {
    if (!fs.readdirSync("./").includes(CONFIG_FILE_NAME)) {
        log.error(MSG_NO_CONFIG);
    }
    const cfg: config = JSON.parse(
        fs.readFileSync(CONFIG_FILE_NAME).toString()
    );
    if (!cfg.clickhouse) log.error(MSG_NO_CLICKHOUSE);

    let ch = cfg.clickhouse;
    ch.database = `DEBUG_${ch.database}`;
    return ch;
}
