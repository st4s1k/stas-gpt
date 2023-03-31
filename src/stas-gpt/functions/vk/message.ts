/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MessagesForeignMessage, MessagesMessage } from "vk-io/lib/api/schemas/objects";
import { getVkForwardHistory, getVkPrivateChatHistory, getVkReplyHistory } from "./chat-history";
import { VkForward } from "./objects";
import { fetchBotId, fetchUnknownUserNames, fetchUserNamesKv, isBotId, persistUserNames } from "./user";

export async function getVkMessageHistoryFor(
    message: MessagesMessage
): Promise<MessagesMessage[]> {
    try {
        await initVkContext();
        await fetchUnknownUserNames(message);

        const peerId: number = message.peer_id!;
        const messageId: number = getMessageId(message);
        const isMsgAnswered: boolean = await isMessageAnswered(peerId, messageId);
        const isGroupChat: boolean = peerId > 2000000000;
        const isBotReferenced = !!(
            globalThis.botId &&
            message.reply_message &&
            isBotId(message.reply_message.from_id)
        );
        const messageText: string = message.text!;
        const shouldAnswer: boolean =
            !isGroupChat || isBotReferenced || messageText.includes(BOT_MENTION);

        if (globalThis.botId && !isMsgAnswered && shouldAnswer) {
            if (isGroupChat) {
                const fwdMessages: MessagesForeignMessage[] | undefined = message.fwd_messages;
                if (fwdMessages && fwdMessages.length > 0) {
                    return await getVkForwardHistory(message);
                } else {
                    return await getVkReplyHistory(message);
                }
            } else {
                return await getVkPrivateChatHistory(peerId);
            }
        } else {
            console.warn("getVkMessageHistoryFor: Message ignored!:", {
                messageText: messageText,
                peerId: peerId,
                isGroupChat: isGroupChat,
                messageId: messageId,
                isMsgAnswered: isMsgAnswered,
                botId: globalThis.botId,
                isBotReferenced: isBotReferenced,
                shouldAnswer: shouldAnswer,
            });
        }
    } catch (error) {
        console.error("getVkMessageHistoryFor: Error handling request: error:", error);
    } finally {
        await persistVkContext();
    }

    return [];
}

export async function sendMessage(
    peerId: number,
    messageId: number,
    messageContent: string
): Promise<void> {
    try {
        const forward: VkForward = {
            peer_id: peerId,
            conversation_message_ids: [messageId],
            is_reply: true,
        };
        console.log("sendMessage: forward:", forward);
        const url: URL = getMessagesSendUrl(peerId, forward, messageContent);
        await fetchMessagesSend(url);
        await addAnsweredMessage(peerId, messageId);
    } catch (error) {
        console.error("sendMessage: error:", error);
    }
}

export function getMessageId(message: MessagesMessage): number {
    const peerId: number = message.peer_id!;
    const isGroupChat: boolean = peerId > 2000000000;
    return isGroupChat
        ? message.conversation_message_id!
        : message.id!;
}

async function fetchMessagesSend(url: URL): Promise<void> {
    const requestInit: RequestInit = {
        method: "GET",
    };
    const sendResponse: Response = await fetch(url, requestInit);
    const sentData = await sendResponse.json();
    console.log("fetchMessagesSend: sentData:", sentData);
}

function getMessagesSendUrl(peerId: number, forward: VkForward, messageContent: string) {
    const url: URL = new URL("https://api.vk.com/method/messages.send");
    const randomId: number = Math.floor(Math.random() * 1000000000);
    url.searchParams.append("access_token", VK_COMMUNITY_API_TOKEN);
    url.searchParams.append("v", VK_API_VERSION);
    url.searchParams.append("peer_id", peerId.toString());
    url.searchParams.append("forward", JSON.stringify(forward));
    url.searchParams.append("message", messageContent);
    url.searchParams.append("random_id", randomId.toString());
    console.log("getMessagesSendUrl: url:", url.toString());
    return url;
}

export function isValidMessage(message: MessagesMessage): boolean {
    let errorMsg: string | undefined;
    if (!message) {
        errorMsg = "message";
    }

    if (!message.text) {
        errorMsg = "message.text";
    }

    if (!message.peer_id) {
        errorMsg = "message.peer_id";
    }

    if (!message.from_id) {
        errorMsg = "message.from_id";
    }

    if (!message.id && !message.conversation_message_id) {
        errorMsg = "message.id && message.conversation_message_id";
    }

    if (errorMsg) {
        console.error(`isValidMessage: Error: Missing value: ${errorMsg}: message:`, message);
    }

    return !errorMsg;
}

export async function isMessageAnswered(peerId: number, messageId: number): Promise<boolean> {
    const messageKey: string = getMessageKey(peerId, messageId);
    return globalThis.answeredMessages.includes(messageKey);
}


export async function addAnsweredMessage(peerId: number, messageId: number): Promise<void> {
    const messageKey: string = getMessageKey(peerId, messageId);
    globalThis.answeredMessages.push(messageKey);
}

function getMessageKey(peerId: number, messageId: number): string {
    return peerId > 2000000000 // is group chat?
        ? `с_${peerId}_${messageId}`
        : `m_${peerId}_${messageId}`;
}

async function initVkContext() {
    await fetchBotId();
    await fetchAnsweredMessagesKv();
    await fetchUserNamesKv();
}

export async function fetchAnsweredMessagesKv(): Promise<void> {
    try {
        const answeredMessagesString: string | null = await STAS_GPT_KV.get("answeredMessages");
        if (answeredMessagesString) {
            try {
                globalThis.answeredMessages = JSON.parse(answeredMessagesString);
            } catch (error) {
                console.error("fetchAnsweredMessages: Error parsing answeredMessages from KV: error:", error);
                globalThis.answeredMessages = [];
            }
        } else {
            console.warn("fetchAnsweredMessages: answeredMessages value is null!");
            globalThis.answeredMessages = [];
        }
    } catch (error) {
        console.error("fetchAnsweredMessages: Error fetching answeredMessages from KV: error:", error);
        globalThis.answeredMessages = [];
    }
}

async function persistVkContext(): Promise<void> {
    await persistAnsweredMessages();
    await persistUserNames();
}

async function persistAnsweredMessages(): Promise<void> {
    const answeredMessagesString = JSON.stringify(globalThis.answeredMessages);
    await STAS_GPT_KV.put("answeredMessages", answeredMessagesString);
}
