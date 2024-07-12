import { ThigukaEntry } from "../ThigukaWordProvider"
import { cmdArgs } from "./cmdArgs"

export type config = {
    "worlds": string[],
    "trustedUsers": string[],
    "badUsers": string[],
    "clickhouse": {
        "host": string
        "username": string
        "password": string
        "database": string
    },
    "thigukaWords": ThigukaEntry[]
    "debug": boolean,
    "denialMessageRateLimitSeconds": number,
    "cliArgs": cmdArgs,
    "nickname": string | ""
}