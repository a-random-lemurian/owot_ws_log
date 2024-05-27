import { ChatDB } from "./Database";

let count = 0;

export function initializeCount(db: ChatDB) {
    db.msgCount((n) => { count = n; })
}

export function increment() {
    count++;
}

export function getCount() {
    return count
}
