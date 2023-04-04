import {
    ChatCompletionRequestMessage,
    ChatCompletionRequestMessageRoleEnum,
} from "../../models/openai";
import { VkMessage } from "../../models/vk";
import { getUserName, isBotId } from "../vk/user";

export async function convertToBotMessages(
    messages: VkMessage[]
): Promise<ChatCompletionRequestMessage[]> {
    return Promise.all(
        messages.map(async (message: VkMessage) => await convertToBotMessage(message))
    );
}

async function convertToBotMessage(
    message: VkMessage
): Promise<ChatCompletionRequestMessage> {
    if (!message.from_id) {
        console.error("convertToBotMessage: message.from_id is undefined: message:", message);
        throw new Error(`convertToBotMessage: message.from_id is undefined: message: ${message}`);
    }
    const role: ChatCompletionRequestMessageRoleEnum = isBotId(message.from_id)
        ? ChatCompletionRequestMessageRoleEnum.Assistant
        : ChatCompletionRequestMessageRoleEnum.User;
    const content: string = getMessageText(message); // await formatMessage(message);
    const userName = getUserName(message.from_id);
    // const sanitizedUsername = sanitizeUsername(userName);
    return {
        role: role,
        content: content,
        // name: sanitizedUsername,
    };
}

/* function sanitizeUsername(username: string): string {
    const allowedCharacters = /^[a-zA-Z0-9_-]+$/;
    const sanitized = username.split("")
        .filter((char) => allowedCharacters.test(char))
        .join("");
    return sanitized.slice(0, 64);
} */

async function formatMessage(
    message: VkMessage,
    indent = 0,
    hasContext = false
): Promise<string> {
    const indentStr: string = "  ".repeat(indent);
    let result = "";

    if (message.text) {
        const text: string = hasContext ? `"${message.text}"` : message.text;
        result += formatText(text, indentStr);
    }

    const replyMessage: VkMessage | undefined = message.reply_message;
    const fwdMessages: VkMessage[] | undefined = message.fwd_messages;
    if (replyMessage || fwdMessages) {
        if (!hasContext) {
            result += `${indentStr}\n[контекст]:\n`;
            hasContext = true;
        }
    }

    if (replyMessage) {
        if (replyMessage.from_id) {
            const userName: string = getUserName(replyMessage.from_id);
            result += `${indentStr}Отвечая на собщение ${userName}:\n`;
            result += await formatMessage(
                replyMessage,
                indent + 1,
                hasContext
            );
        } else {
            console.error("formatMessage: replyMessage.from_id is undefined: replyMessage:", replyMessage);
        }
    }

    if (fwdMessages && fwdMessages.length > 0) {
        result += await formatForwardedMessages(
            fwdMessages,
            indent + 1,
            hasContext
        );
    }

    return result;
}

function formatText(text: string, indentStr = ""): string {
    return (
        text
            .split("\n")
            .map((line) => `${indentStr}${line}`)
            .join("\n") + "\n"
    );
}

async function formatForwardedMessages(
    fwdMessages: VkMessage[],
    indent: number,
    hasContext: boolean
): Promise<string> {
    const indentStr: string = "  ".repeat(indent);

    const formattedMessages: string[] = await Promise.all(
        fwdMessages.map(async (fwdMessage: VkMessage) => {
            if (fwdMessage.from_id) {
                const userName: string = getUserName(fwdMessage.from_id);
                const formattedMessage: string = await formatMessage(
                    fwdMessage,
                    indent + 1,
                    hasContext
                );
                return `${indentStr}Пересланное собщение от ${userName}:\n${formattedMessage}`;
            } else {
                console.error("formatForwardedMessages: fwdMessage.from_id is undefined: fwdMessage:", fwdMessage);
                return "";
            }
        })
    );

    return formattedMessages
        .filter((item) => item.length > 0)
        .join("");
}

export function getPeerId(message: VkMessage): number {
    const peerId: number | undefined = message.peer_id;
    if (!peerId) {
        throw new Error(`handleBotResponse: message.peer_id is undefined: message: ${message}`);
    }
    return peerId;
}

export function getMessageId(message: VkMessage): number {
    const peerId: number = getPeerId(message);
    const messageId = isGroupChat(peerId)
        ? message.conversation_message_id
        : message.id;
    if (!messageId) {
        console.error("getMessageId: messageId is undefined: message:", message);
        throw new Error(`getMessageId: messageId is undefined: message: ${message}`);
    }
    return messageId;
}

export function getMessageText(message: VkMessage): string {
    const messageText: string | undefined = message.text;
    if (!messageText) {
        console.error("getMessageText: messageText is undefined: message:", message);
        throw new Error(`getMessageText: messageText is undefined: message: ${message}`);
    }
    return messageText;
}

export function isGroupChat(peerId: number): boolean {
    return peerId > 2000000000;
}

export function hasReplyMessage(message: VkMessage): boolean {
    validateMessage(message);
    return message.reply_message !== undefined;
}

export function hasForwardHistory(message: VkMessage): boolean {
    return message.fwd_messages !== undefined && message.fwd_messages.length > 0;
}

export function validateMessage(message: VkMessage): void {
    let errorMessage: string | undefined;
    if (!message) {
        errorMessage = "message";
    }

    if (!message.text) {
        errorMessage = "message.text";
    }

    if (!message.peer_id) {
        errorMessage = "message.peer_id";
    }

    if (!message.from_id) {
        errorMessage = "message.from_id";
    }

    if (!message.id && !message.conversation_message_id) {
        errorMessage = "message.id && message.conversation_message_id";
    }

    if (errorMessage) {
        console.error(`validateMessage: Value is undefined: ${errorMessage}: message:`, message);
        throw new Error(`validateMessage: Value is undefined: ${errorMessage}: message: ${message}`);
    }
}
