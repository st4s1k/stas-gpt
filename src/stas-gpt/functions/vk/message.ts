import { MessagesForeignMessage, MessagesMessage } from "vk-io/lib/api/schemas/objects";
import { getVkForwardHistory, getVkPrivateChatHistory, getVkReplyHistory } from "./chat-history";
import { fetchBotId } from "./user";

export async function getVkMessageHistoryFor(
    message: MessagesMessage
): Promise<MessagesMessage[]> {
    try {
        await fetchBotId();

        const messageText: string = message.text!;
        const peerId: number = message.peer_id!;
        const isGroupChat: boolean = peerId > 2000000000;
        const messageId: number = getMessageId(message);
        const isMsgAnswered: boolean = await isMessageAnswered(
            peerId,
            messageId,
            isGroupChat
        );
        const isBotReferenced: boolean = !!(
            globalThis.botId &&
            message.reply_message &&
            Math.abs(message.reply_message.from_id) === globalThis.botId
        );
        const shouldAnswer: boolean =
            !isGroupChat || isBotReferenced || messageText.includes(BOT_MENTION);

        if (!isMsgAnswered && globalThis.botId && shouldAnswer) {
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
    }

    return [];
}

export async function sendMessage(
    peerId: number,
    messageId: number,
    messageContent: string
) {
    try {
        const forward: any = {
            peer_id: peerId,
            conversation_message_ids: [messageId],
            is_reply: true,
        };
        console.log("sendMessage: forward:", forward);
        const url: URL = getMessagesSendUrl(peerId, forward, messageContent);
        const sentData: any = await fetchMessagesSend(url);
        await addAnsweredMessage(peerId, messageId);
        return sentData;
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

async function fetchMessagesSend(url: URL) {
    const requestInit: RequestInit = {
        method: "GET",
    };
    const sendResponse: Response = await fetch(url, requestInit);
    const sentData: any = await sendResponse.json();
    console.log("fetchMessagesSend: sentData:", sentData);
    return sentData;
}

function getMessagesSendUrl(peerId: number, forward: any, messageContent: string) {
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

export async function isMessageAnswered(
    peerId: number,
    messageId: number,
    isGroupChat: boolean
): Promise<boolean> {
    const messageKey: string = isGroupChat
        ? `с_${peerId}_${messageId}`
        : `m_${peerId}_${messageId}`;
    const answeredMessagesString: string | null = await STAS_GPT_KV.get(
        "answeredMessages"
    );
    const answeredMessages: string[] = answeredMessagesString
        ? JSON.parse(answeredMessagesString)
        : [];
    return answeredMessages.includes(messageKey);
}

export async function addAnsweredMessage(
    peerId: number,
    messageId: number
): Promise<void> {
    const isGroupChat: boolean = peerId > 2000000000;
    const messageKey: string = isGroupChat
        ? `с_${peerId}_${messageId}`
        : `m_${peerId}_${messageId}`;
    const answeredMessagesString: string | null = await STAS_GPT_KV.get(
        "answeredMessages"
    );
    const answeredMessages: string[] = answeredMessagesString
        ? JSON.parse(answeredMessagesString)
        : [];
    answeredMessages.push(messageKey);
    await STAS_GPT_KV.put("answeredMessages", JSON.stringify(answeredMessages));
}
