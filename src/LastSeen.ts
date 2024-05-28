
/*
 * LastSeen is an interface that helps return users' last-seen
 */

import { ChatDB } from "./Database";
import { ChatMessage } from "./types/chatMessage"

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

}
