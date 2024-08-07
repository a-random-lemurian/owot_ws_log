import { TypedEmitter } from "tiny-typed-emitter";
import * as wslib from "ws";
import { ChatMessage } from "../types/chatMessage";
import { MessagePing } from "./messages";

export interface OwotWSEvents {
    "connected": () => void;
    "disconnected": () => void;
    "message_chat": (m: ChatMessage) => void;
    "message_ping": (m: MessagePing) => void;
};

export enum ChatLocation {
    Global = "global",
    Page = "page",
}

export class OwotWS extends TypedEmitter<OwotWSEvents> {
    ws!: WebSocket;

    constructor(url: string | URL) {
        super();
        this.ws = new WebSocket(url);

        this.ws.addEventListener("open", () => {
            this.emit("connected");
        });
        this.ws.addEventListener("close", () => {
            this.emit("disconnected");
        })

        this.ws.addEventListener("message", (ev) => {
            let obj = JSON.parse(ev.data);
            let kind = obj["kind"];

            if (kind == "chat") { this.handleChat(obj); }
            if (kind == "ping") { this.handlePing(obj); }
        });
    }

    private handleChat(obj: ChatMessage) {
        this.emit("message_chat", obj);
    }

    private handlePing(obj: MessagePing) {
        this.emit("message_ping", obj);
    }

    private transmit(obj: object) {
        this.ws.send(JSON.stringify(obj));
    }

    nextPingId = 0

    public ping(): Promise<number> {
        return new Promise((resolve, reject) => {
            let start = Date.now();
            let id = ++this.nextPingId;

            let onmsg = (m: MessagePing) => {
                if (m.id !== id) return;
                this.off("message_ping", onmsg);
                resolve(Date.now() - start)
            }

            this.on("message_ping", onmsg);
            this.transmit({
                kind: "ping",
                id
            });
        });
    }

    public chat(
        message: string,
        location: ChatLocation = ChatLocation.Page,
        nickname: string = "",
        color: string = "#000000",
        customMeta?: { [key: string]: string }): void {
        this.transmit({
            kind: "chat",
            nickname,
            message,
            location,
            color,
            customMeta
        });
    }

    /**
     * Close the websocket. Remember to remove all the event listeners
     * when you are done.
     */
    public close() {
        this.ws.close();
    }
}
