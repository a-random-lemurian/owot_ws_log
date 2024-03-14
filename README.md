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
* `globalChatPolicy` - Recommended to set it to `frontPageOnly` otherwise you
  will receive multiple copies of global chat messages. This will amplify the
  power of a Starianna attack and you do not want that.
* `trustedUsers` - Users who are allowed to run commands that control or
  query the bot's current status.

## Commands
Not implemented yet.

`ch msgcount` - total amount of messages in DB
`ch size` - total size of SQLite database file
