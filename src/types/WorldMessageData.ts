import { ChatMessage } from "./chatMessage";
import { World } from "../World";

export interface WorldMessageData {
    message: ChatMessage,
    worldName: string,
    world: World
}
