
/*
 * LastSeen is an interface that helps return users' last-seen
 */

import { ChatDB } from "./Database";
import { ChatMessage } from "./types/chatMessage"

export class LastSeen {
    private lastMessages: {
        [key: string]: {
            consent: boolean,
            msg: ChatMessage,

            // The last time a user wa
            lastRead: Date,
        }
    }
    maxCacheSize: number;
    db: ChatDB;

    private checkCache() {
        if (Object.keys(this.lastMessages).length < this.maxCacheSize) {
            return;
        }
    }

    private hasUser(user: string) {
        return this.lastMessages.hasUser !== undefined;
    }

    constructor(cfg: {db: ChatDB}) {
        this.maxCacheSize = 20000;
        this.db = cfg.db;
        this.lastMessages = {};
    }

    takeInMessage(msg: ChatMessage) {
        if (!msg.realUsername) return;
        if (this.lastMessages[msg.realUsername]) {
            this.lastMessages[msg.realUsername].lastRead = new Date();
            this.lastMessages[msg.realUsername].msg = msg;
        }
    }

    /*
     * Get someone's last message.
     */
    async lastSeen(user: string) {
        this.checkCache();

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
        this.db.lastSeenSetOpt(user, consent);
    }

    /*
     * Check whether someone opted in or out.
     */
    async consent(user: string) {
        if (this.hasUser(user)) {
            
        }
        const result = await this.db.lastSeenCheckOpt(user);
    }

}
