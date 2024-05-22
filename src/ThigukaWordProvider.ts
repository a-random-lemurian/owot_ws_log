import { log as awlog } from "./app_winston";
const log = awlog.child({ moduleName: "ThigukaWordProvider" });

export interface ThigukaEntry {
    word: string,
    define: string
}

export class ThigukaWordProvider {
    words: ThigukaEntry[]

    constructor(params: {
        words: ThigukaEntry[]
    }) {
        this.words = params.words
        log.info(`Initializing dictionary with ${params.words.length}`);
    }

    private formatEntry(word: ThigukaEntry): string {
        return `Thiguka Dictionary: ${word.word} - ${word.define}`
    }

    randomEntry(): ThigukaEntry {
        const word = this.words[Math.ceil(Math.random() * this.words.length)];
        return word;
    }

    randomEntryText(): string {
        const entry = this.formatEntry(this.randomEntry());
        log.info(`Assembled entry string: '${entry}'`);
        return entry;
    }
}
