import express, { Express, Router } from "express";
import { log as awlog } from "../app_winston";
import { getCount, initializeCount } from "../chatMessageCount";
import { ChatDB } from "../Database";
export const DEFAULT_API_PORT = 21655

const log = awlog.child({ moduleName: "APIServer" });

function createExpressApi(db: ChatDB) {
    const app: Express = express();
    const api = Router();
    app.get("/", (req, res) => {
        res.status(200).json({ "message": "The owot ws log server welcomes you. ffdr on top" })
    })

    app.use("/api/v1", api)

    api.get("/count", (req, res) => {
        db.msgCount((n)=>{
            res.status(200).json({ messages: n })
        })
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
