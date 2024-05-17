import * as cmdr from "commander";
import * as fs from "fs";
import { ChatDB, ClickhouseConnDetails } from "../../Database";
import { config } from "../../types/config";
import { log as awlog } from "../../app_winston";
import { inspect } from "util";

const log = awlog.child({ moduleName: "create-test-data" });

const root = new cmdr.Command()
    .description("Creates mock OWOT data to test the bot.")
    .option("-C --config [CONFIG]", "Configuration file", "config.json")
    ;

root.action(async (args: {
    config: string
}) => {
    const cfg: config = JSON.parse(
        fs.readFileSync(args.config).toString(`utf-8`)
    );

    log.info(`Arguments: ` + inspect(args, {depth: Infinity}));

    // We are using the DEBUG version of the database here
    let creds: ClickhouseConnDetails = cfg.clickhouse;
    creds.database = "DEBUG_" + creds.database;

    log.info(`Connecting to ${creds.database}`);
    const db = new ChatDB(creds);
    await db.connect();
    log.info(`Connected to the database.`);

    for (let i = 0; i < 100; i++) {
        db.lastSeenSetOpt(
            `FakeUser${i.toString().padStart(3, '0')}`,
            (i % 2 == 0)
        );
    }
});

root.parse();

