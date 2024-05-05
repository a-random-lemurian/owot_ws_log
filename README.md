# Lemurian OWOT Logger

The logger that logs OWOT chat!

## Run
Dependencies:
```
npm i
```

Before running for the first time:

* Install Clickhouse.
* Put some credentials into `config.json`.

Run:
```
node build/src/index.js -C config.json start &
```

## Configure
```json
{
    "worlds": [""],
    "globalChatPolicy": "frontPageOnly",
    "trustedUsers": ["FP"],
}
```

* `worlds` - Worlds to log
* `trustedUsers` - Users who are allowed to run commands that control or
  query the bot's current status.

## Commands

* `ch size` - total amount of messages

## Etymology

Why is it called `owot_ws_log`?

This bot is the successor to an older logging bot, which relied on using a
userscript to "feed" messages to a rest API that fed in JSON, back when I
had no understanding of how OWOT websockets worked. The term `owot_ws_log`
was originally meant to reflect the fact that it logged the websocket directly
instead of relying on userscripts sending data.
