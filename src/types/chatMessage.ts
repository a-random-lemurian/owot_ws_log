import * as SOB from 'simple-owot-bot';

export interface ChatMessage {
    /**
     * Sender's chat id.
     */
    id: number;
    /**
     * Sender's nickname.
     */
    nickname: string;
    /**
     * Sender's username (only if {@link registered} is true)
     */
    realUsername?: string;
    /**
     * Whether the sender is registered or not.
     */
    registered: boolean;
    /**
     * Whether the sender is an OP or not.
     */
    op: boolean;
    /**
     * Whether the sender is an admin or not.
     */
    admin: boolean;
    /**
     * Whether the sender is staff or not.
     */
    staff: boolean;
    /**
     * The location of the message
     */
    location: SOB.ChatLocation;
    /**
     * The message text.
     */
    message: string;
    /**
     * Sender's chat color.
     */
    color: string;
    /**
     * The date and time on which the message was sent.
     */
    date: number;
    /**
     * Sender's rank name, if any.
     */
    rankName?: string;
    /**
     * Sender's rank color, if any.
     */
    rankColor?: string;
    /**
     * Whether it was a private message, and who received it.
     */
    privateMessage?: "to_me" | "from_me";
}
