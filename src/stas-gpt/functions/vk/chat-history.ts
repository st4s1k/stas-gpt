import { fetchWithCache, generateVkApiUrl } from "../utils/api";
import {
    getPeerId,
    hasForwardHistory,
    hasReplyMessage,
    isGroupChat
} from "../utils/message";
import {
    VkGetByConversationMessageIdResponse,
    VkGetHistoryResponse,
    VkMessage,
    VkResponse
} from "../../models/vk";

export async function getVkChatHistory(message: VkMessage): Promise<VkMessage[]> {
    try {
        const peerId: number = getPeerId(message);
        return isGroupChat(peerId)
            ? await getGroupChatHistory(message)
            : await getVkPrivateChatHistory(peerId);
    } catch (error) {
        console.error("getVkChatHistory: Error getting chat history: error:", error);
        throw new Error(`getVkChatHistory: Error getting chat history: error: ${error}`);
    } finally {
        console.log("getVkChatHistory: done");
    }
}

async function getGroupChatHistory(message: VkMessage): Promise<VkMessage[]> {
    const histories = [
        hasReplyMessage(message) ? getVkReplyHistory(message) : Promise.resolve([]),
        hasForwardHistory(message) ? getVkForwardHistory(message) : Promise.resolve([])
    ];
    const combinedHistory = (await Promise.all(histories)).flat();
    return combinedHistory.length > 0 ? combinedHistory : [message];
}

async function getVkReplyHistory(
    message: VkMessage
): Promise<VkMessage[]> {
    try {
        const peerId: number = getPeerId(message);
        let conversationMessageId: number | undefined = message.conversation_message_id;
        const replyChain: VkMessage[] = [];

        if (!conversationMessageId) {
            return [];
        }

        while (replyChain.length < VK_MESSAGE_HISTORY_LIMIT && conversationMessageId) {
            const requestInit: RequestInit = {
                method: "GET",
            };

            const url: URL = generateVkApiUrl("messages.getByConversationMessageId", {
                peer_id: peerId,
                conversation_message_ids: conversationMessageId,
            });

            console.log("getVkReplyHistory: url:", url.toString());

            const data: VkResponse<VkGetByConversationMessageIdResponse> = await fetchWithCache(url, requestInit);

            console.log("getVkReplyHistory: data:", data);

            const messagesGetByConversationMessageIdResponse: VkGetByConversationMessageIdResponse | undefined =
                data.response;
            if (messagesGetByConversationMessageIdResponse
                && messagesGetByConversationMessageIdResponse.items
                && messagesGetByConversationMessageIdResponse.items[0]) {
                const fetchedMessage: VkMessage = messagesGetByConversationMessageIdResponse.items[0];
                replyChain.push(fetchedMessage);
                const replyMessage = fetchedMessage.reply_message as VkMessage;
                if (replyMessage) {
                    conversationMessageId = replyMessage.conversation_message_id;
                } else {
                    break;
                }
            } else {
                console.error("getVkReplyHistory: Error fetching reply history: data:", data);
                break;
            }
        }

        console.log("getVkReplyHistory: replyChain:", replyChain);

        return replyChain;
    } catch (error) {
        console.error("getVkReplyHistory: Error getting reply history: error:", error);
        throw new Error(`getVkReplyHistory: Error getting reply history: error: ${error}`);
    } finally {
        console.log("getVkReplyHistory: done");
    }
}

async function getVkForwardHistory(
    message: VkMessage
): Promise<VkMessage[]> {
    try {
        const forwardHistory: VkMessage[] | undefined = message.fwd_messages;
        if (!forwardHistory) {
            console.error("getVkForwardHistory: Missing forward messages: message:", message);
            return [message];
        }
        forwardHistory.push(message);
        forwardHistory.reverse();
        return forwardHistory;
    } catch (error) {
        console.error("getVkForwardHistory: Error getting forward history: error:", error);
        throw new Error(`getVkForwardHistory: Error getting forward history: error: ${error}`);
    } finally {
        console.log("getVkForwardHistory: done");
    }
}

async function getVkPrivateChatHistory(
    peerId: number
): Promise<VkMessage[]> {
    try {
        const requestInit: RequestInit = {
            method: "GET",
        };

        const url: URL = generateVkApiUrl("messages.getHistory", {
            peer_id: peerId,
            count: VK_MESSAGE_HISTORY_LIMIT,
        });

        console.log("getVkPrivateChatHistory: url:", url.toString());

        const data: VkResponse<VkGetHistoryResponse> = await fetchWithCache(url, requestInit);

        console.log("getVkPrivateChatHistory: data:", data);

        const getHistoryResponse: VkGetHistoryResponse | undefined = data.response;

        if (getHistoryResponse && getHistoryResponse.items) {
            return getHistoryResponse.items;
        } else {
            console.error("getVkPrivateChatHistory: Error fetching chat history: data:", data);
            throw new Error(`getVkPrivateChatHistory: Error fetching chat history: data: ${data}`);
        }
    } catch (error) {
        console.error("getVkPrivateChatHistory: Error getting chat history: error:", error);
        throw new Error(`getVkPrivateChatHistory: Error getting chat history: error: ${error}`);
    } finally {
        console.log("getVkPrivateChatHistory: done");
    }
}
