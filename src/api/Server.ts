import express, { Express, Request, Router } from "express";
import { log as awlog } from "../app_winston";
import { getCount, initializeCount } from "../chatMessageCount";
import cors from "cors";
import { ChatDB } from "../Database";
import { validateDate } from "./validateDate";
export const DEFAULT_API_PORT = 21655

const log = awlog.child({ moduleName: "APIServer" });

const MAXIMUM_MESSAGE_ROWS = 1000;

function createExpressApi(db: ChatDB) {
    const app: Express = express();
    const api = Router();
    app.get("/", (req, res) => {
        res.status(200).json({ "message": "The owot ws log server welcomes you. ffdr on top" })
    })

    app.use(cors<Request>({origin:"*"}))
    app.use("/api/v1", api)

    api.get("/count", (req, res) => {
        db.msgCount((n)=>{
            res.status(200).json({ messages: n })
        })
    });

    api.get("/messages", async (req, res) => {
        const searchTerm = req.query["searchTerm"]?.toString()
        const params = {
            query: searchTerm!,
            pageSize: parseInt(req.query.pageSize?.toString()!) || 100
        }
        console.log(params)
        
        if (!searchTerm) {
            res.status(400).json({"error": "searchTerm parameter not specified", "id": "no-search-term"});
            return
        }
        if (params.pageSize > MAXIMUM_MESSAGE_ROWS) {
            res.status(400).json({"error": "too many rows", "id": "too-many", "maximum": MAXIMUM_MESSAGE_ROWS})
        }
    
        res.status(200).json((await db.searchMessage(params)))
    })

    api.get("/daily_messages/:year/:month/:day", async (req, res) => {

        const validationResult = validateDate(req.params.year, req.params.month, req.params.day)
        if (validationResult.hasError) {
            res.status(validationResult.statusCode).send(validationResult.error);
            return
        }

        const messages = (await db.getDaysMessages({ date: validationResult.date! }));

        if (messages?.length === 0) {
            res.status(404).json({"error": "no messages found", "id": "not-found"});
            return
        }

        res.status(200).json(messages)
    })

    api.get("/available_days", async (req, res) => {
        res.status(200).json((await db.getAvailableDays()))
    })

    return app
}

export class Server {
    app!: Express;
    db!: ChatDB;
    port!: number

    constructor(opts: Partial<Server>) {
        Object.assign(this, opts)

        if (!this.port) {
            this.port = DEFAULT_API_PORT
        }
    }
    
    public start() {
        this.app = createExpressApi(this.db);
        this.app.listen(this.port, () => {
            log.info("Started the API");
        });
        this.db.connect();
        initializeCount(this.db)
    }
}
