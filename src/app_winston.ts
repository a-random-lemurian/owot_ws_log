import { createLogger, transports, format } from "winston";

export const log = createLogger({
    transports: [new transports.Console()],
    format: format.combine(
        format.colorize(),
        format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        format.printf((info) => {
            return `${info.timestamp} ${info.level} - ${info.message}`
        })
    ),
    defaultMeta: {
        service: "owot_log",
    },
});
