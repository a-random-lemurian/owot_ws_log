import { ChatMessage } from "../../types/chatMessage";
import { ChatLocation } from "simple-owot-bot";

export class MessageGenerator {
    constructor() {

    }

    private makeLocation(): ChatLocation {
        if (Math.random() > 0.5) {
            return ChatLocation.Global;
        }
        return ChatLocation.Page;
    }

    private makeRealUsername(): string {
        return `FakeUser`
             + `${Math.ceil(Math.random() * 99).toString().padStart(3, '0')}`;
    }

    generateMessage(): ChatMessage {
        return {
            "nickname": "Mock Message from a Fake User",
            "realUsername": this.makeRealUsername(),
            "id": Math.ceil(Math.random() * 9999),
            "message": "Mock Message",
            "registered": true,
            "location": this.makeLocation(),
            "op": false,
            "admin": false,
            "staff": false,
            "color": "#008ec4",
            "date": Date.now()
        }
    }
}
