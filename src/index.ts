

import * as cmdr from "commander";
import { Logger } from "./Logger";
import { log as awlog } from "./app_winston";
import { config as configType } from "./types/config"
import { cmdArgs } from "./types/cmdArgs";
import * as fs from "fs";
import { inspect } from "util";
import * as mig from "./migrate"
import { ThigukaEntry } from "./ThigukaWordProvider";

const log = awlog.child({ moduleName: "CLI" });

const root = new cmdr.Command().version('2.0.0')
    .helpCommand("help")
    .option("-C, --config <value>", "Configuration file", "../config.json")
    .option("-d, --debug", "Debug mode", false)
    ;

    const start = new cmdr.Command("start")
    .description("Start a bot")
    .option("-D, --denials <value>", "JSON file to source snarky denials from", "../denials.json")
    .option("-N, --no-database", "Do not insert into ClickHouse", true)
    .option("    --thiguka <value>", "JSON file for Thiguka words", "../thiguka.json")
;

root.addCommand(start);

const migrate = new cmdr.Command("migrate")
    .description("Migrate from the old SQLite3 based logger")
    .addArgument(new cmdr.Argument("file", "SQLite3 database file"));

root.addCommand(migrate)

function getData(args: any): { allArgs: cmdArgs, config: configType, thigukaWordList: ThigukaEntry[] } {
    const allArgs: cmdArgs = { ...args, ...root.opts() }
    const config: configType = JSON.parse(
        fs.readFileSync(allArgs.config, { encoding: `utf8` })
    );
    const thigukaWords = JSON.parse(
        fs.readFileSync(allArgs.thiguka, { encoding: `utf8` })
    );

    return { allArgs, config, thigukaWordList: thigukaWords };
}

migrate.action((args) => {
    const data = getData(args);
    mig.migrate({
        clickhouse: data.config.clickhouse,
        oldSqliteFile: args
    })
})

start.action(async (args) => {
    log.info(`Starting owot_ws_log v2...`);
    log.info(`ffdr on top`);

    const data = getData(args);

    log.info(`read config at: ${data.allArgs.config}`);
    log.info(`joining worlds: ${data.config.worlds}`);

    if (data.allArgs.debug) {
        log.info("Debug mode active. Will not write data to ClickHouse.");
    }

    console.log(data.allArgs);

    const logger = new Logger({
        ...data.config,
        thigukaWords: data.thigukaWordList,
        "cliArgs": data.allArgs
    });
    await logger.init();

    data.config.worlds.forEach(w => {
        logger.join(w);
    })
})

root.parse()

/*
 * TODO: `ch size` command
 */
