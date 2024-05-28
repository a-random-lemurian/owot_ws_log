
/*
 * LastSeen is an interface that helps return users' last-seen
 */

import { ChatDB } from "./Database";
import { ChatMessage } from "./types/chatMessage"

const ALL_LASTSEEN_DATES = `
SELECT realUsername, max(date) AS lastseen
FROM owot_chat_log.chat_message
GROUP BY realUsername order by lastseen
LIMIT 5000;`;

export class LastSeen {
    private lastMessages: {
        [key: string]: {
            consent: boolean,
            lastMessageDate: Date,
            lastRead: Date
        }
    }
    private nonExistentUsers: string[];
    maxCacheSize: number;
    db: ChatDB;

    private checkCache() {
        if (Object.keys(this.lastMessages).length < this.maxCacheSize) {
            return;
        }
    }

    private hasUser(user: string) {
        return Object.keys(this.lastMessages).includes(user)
    }

    constructor(cfg: {db: ChatDB}) {
        this.maxCacheSize = 20000;
        this.db = cfg.db;
        this.lastMessages = {};
        this.nonExistentUsers = [];

        this.fillInUsernames();
    }

    takeInMessage(msg: ChatMessage) {
        if (!msg.realUsername) return;
        const user = msg.realUsername
        if (this.nonExistentUsers.includes(user)) {
            this.nonExistentUsers.filter(e => e !== user)
        }
        if (this.lastMessages[user]) {
            this.lastMessages[user].lastMessageDate = new Date(msg.date);
        }
    }

    /*
     * Get someone's last message.
     */
    async lastSeen(user: string) {
        this.checkCache();

        if (this.nonExistentUsers.includes(user)) {
            return null;
        }

        if (this.hasUser(user)) {
            const last = await this.db.lastSeen(user);
            if (last?.length == 0) {}
        }
        return this.lastMessages[user];
    }

    /*
     * Register a member's opt-in and opt-out status.
     */
    setConsent(user: string, consent: boolean) {
        this.checkCache();
        if (this.hasUser(user)) {
            this.lastMessages[user].consent = consent,
            this.lastMessages[user].lastRead = new Date()
        }
        this.db.lastSeenSetOpt(user, consent);
    }

    /*
     * Check whether someone opted in or out.
     */
    async consent(user: string) {
        if (this.hasUser(user)) {
            return this.lastMessages[user].consent;
        }
        const result = await this.db.lastSeenCheckOpt(user);
        let consent = false;
        if (result.found == false) {
            this.nonExistentUsers.push(user);
            consent = true;
        } else {
            consent = result.consent;
        }
        return consent;
    }

    /* Fetch all usernames from the database.
     *
     * TODO: limit to first 5000
     */
    private fillInUsernames() {
        const data = this.db.client?.query(ALL_LASTSEEN_DATES)
        data?.forEach(async row => {
            const ru: string = row["realUsername"]
            this.lastMessages[ru] = {
                consent: await this.consent(ru),
                lastRead: new Date(),
                lastMessageDate: row["lastseen"]
            }
        })
    }
}
