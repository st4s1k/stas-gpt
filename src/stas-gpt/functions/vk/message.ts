/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ShouldNotAnswerError } from "../../exceptions/vk";
import {
    VkForward,
    VkMessage,
    VkMessageSendResponse
} from "../../models/vk";
import { generateVkApiUrl } from "../utils/api";
import {
    getMessageId,
    getMessageText,
    hasReplyMessage,
    isGroupChat
} from "../utils/message";
import { getVkChatHistory } from "./chat-history";
import { isBotId } from "./user";

export async function getVkMessages(
    message: VkMessage
): Promise<VkMessage[]> {
    try {
        if (shouldAnswer(message)) {
            return await getVkChatHistory(message);
        } else {
            throw new ShouldNotAnswerError();
        }
    } catch (error) {
        if (error instanceof ShouldNotAnswerError) {
            throw error;
        }
        console.error("getVkMessages: Error handling request: error:", error);
        throw new Error(`getVkMessages: Error handling request: error: ${error}`);
    } finally {
        console.log("getVkMessages: done");
    }
}

function shouldAnswer(message: VkMessage) {
    const peerId: number = message.peer_id!;
    const messageId: number = getMessageId(message);
    const isMsgAnswered: boolean = isMessageAnswered(peerId, messageId);
    const messageText: string = getMessageText(message);
    const isBotReferenced: boolean =
        messageText.includes(BOT_MENTION) ||
        messageText.includes(`club${BOT_ID}`) ||
        (hasReplyMessage(message) && isBotId(Math.abs(message.reply_message!.from_id!)));
    const shouldAnswer: boolean = !isMsgAnswered && (!isGroupChat(peerId) || isBotReferenced);
    if (!shouldAnswer) {
        console.warn("shouldAnswer: Message ignored!:", {
            messageText: messageText,
            peerId: peerId,
            "isGroupChat": isGroupChat(peerId),
            messageId: messageId,
            isMsgAnswered: isMsgAnswered,
            isBotReferenced: isBotReferenced,
            shouldAnswer: shouldAnswer,
        });
    }
    return shouldAnswer;
}

export async function sendMessage(
    peerId: number,
    messageId: number,
    messageContent: string
): Promise<void> {
    try {
        const forward: VkForward = {
            peer_id: peerId,
            is_reply: true,
        };

        if (isGroupChat(peerId)) {
            forward.conversation_message_ids = [messageId];
        } else {
            forward.message_ids = [messageId];
        }

        console.log("sendMessage: forward:", forward);

        const requestInit: RequestInit = {
            method: "POST",
        };

        const params: Record<string, string> = {
            peer_id: peerId.toString(),
            forward: JSON.stringify(forward),
            message: messageContent,
            random_id: Math.floor(Math.random() * 1000000000).toString(),
        };
        const url = generateVkApiUrl("messages.send", params);

        console.log("getMessagesSendUrl: url:", url.toString());

        const response: Response = await fetch(url, requestInit);
        const data: VkMessageSendResponse = await response.json();

        if (data.error_msg) {
            console.error("sendMessage: Error sending message: data:", data);
            throw new Error(`sendMessage: Error sending message: data: ${data}`);
        }
    } catch (error) {
        console.error("sendMessage: error:", error);
        throw new Error(`sendMessage: error: ${error}`);
    } finally {
        console.log("sendMessage: done");
    }
}

export function isMessageAnswered(peerId: number, messageId: number): boolean {
    const messageKey: string = getMessageKey(peerId, messageId);
    return globalThis.answeredMessages.includes(messageKey);
}

export function persistAnsweredMessage(peerId: number, messageId: number): void {
    const messageKey: string = getMessageKey(peerId, messageId);
    globalThis.answeredMessages.push(messageKey);
    const answeredMessagesString = JSON.stringify(globalThis.answeredMessages);
    globalThis.event.waitUntil(STAS_GPT_KV.put("answeredMessages", answeredMessagesString));
}

function getMessageKey(peerId: number, messageId: number): string {
    return `${peerId}_${messageId}`;
}

export async function initAnsweredMessages(): Promise<void> {
    try {
        const answeredMessagesString: string | null = await STAS_GPT_KV.get("answeredMessages");
        if (answeredMessagesString) {
            try {
                globalThis.answeredMessages = JSON.parse(answeredMessagesString);
                console.log("initAnsweredMessages: answeredMessages:", globalThis.answeredMessages);
            } catch (error) {
                console.error("fetchAnsweredMessages: Error parsing answeredMessages from KV: error:", error);
                throw new Error(`fetchAnsweredMessages: Error parsing answeredMessages from KV: error: ${error}`);
            }
        } else {
            console.warn("fetchAnsweredMessages: answeredMessages value is null!");
        }
    } catch (error) {
        console.error("fetchAnsweredMessages: Error fetching answeredMessages from KV: error:", error);
        throw new Error(`fetchAnsweredMessages: Error fetching answeredMessages from KV: error: ${error}`);
    }
    console.log("initAnsweredMessages: done");
}
