export interface QuoteProviderConfiguration {
    quotes: string[]
};

export class QuoteProvider {
    quotes: string[]

    constructor(cfg: QuoteProviderConfiguration) {
        this.quotes = cfg.quotes;
    }

    randomQuote() {
        return this.quotes[Math.floor(Math.random() * this.quotes.length)];
    }
}
