import * as cmdr from "commander";

const root = new cmdr.Command()
    .description("Creates mock OWOT data to test the bot.")
    .option("-C --config", "Configuration file", "config.json")
;

root.parse()

