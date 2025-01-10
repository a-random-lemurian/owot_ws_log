import { ChatMessage } from "./types/chatMessage";
import { log as awlog } from "./app_winston";

const log = awlog.child({ moduleName: "Logger" });

export interface FilterRule {
    name: string,
    description: string
    run: FilterFunction
}

export type FilterFunction = (a: ChatMessage) => FilterConsequence;

export const onionFilter: FilterRule = {
    name: "onion link filter",
    description: "Block tor onion links",
    run: (m: ChatMessage) => {
        if (m.message.match(/\.onion/)) {
            return { doNotLog: true }
        }
        return {}
    }
}

export interface FilterConsequence {
    doNotLog?: boolean
}

export class Filter {
    filters!: FilterRule[];

    constructor(filters: FilterRule[]) {
        this.filters = filters
    }

    checkMessage(m: ChatMessage) : FilterConsequence {
        let cumulativeResults = {}

        const defaults: FilterConsequence = {
            doNotLog: false
        };
        
        for (const filter of this.filters) {
            cumulativeResults = {
                ...cumulativeResults,
                ...(filter.run(m))
            };
        }
        
        return {...defaults, ...cumulativeResults};
    }

    showFilterInformation() {
        this.filters.forEach(filter => {
            log.info(`Filter active: ${filter.name} - ${filter.description}`)
        })
    }
}
