import { cmdArgs } from "./cmdArgs"

export type config = {
    "worlds": string[],
    "trustedUsers": string[]
    "clickhouse": {
        "host": string
        "username": string
        "password": string
        "database": string
    },
    "debug": boolean,
    "denialMessageRateLimitSeconds": number,
    "cliArgs": cmdArgs,
    "nickname": string | ""
}