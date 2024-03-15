# Lemurian OWOT Logger

The logger that logs OWOT chat!

## Run
Dependencies:
```
npm i
```

Before running for the first time:
```
mkdir logs
sqlite3 main.db '.read schema.sql'
```

Run:
```
node log.js > $(date --iso-8601)
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

* `ch size` - total size of SQLite database file

## Etymology

Why is it called `owot_ws_log`?

This bot is the successor to an older logging bot, which relied on using a
userscript to "feed" messages to a rest API that fed in JSON, back when I
had no understanding of how OWOT websockets worked. The term `owot_ws_log`
was originally meant to reflect the fact that it logged the websocket directly
instead of relying on userscripts sending data.
