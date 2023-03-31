import { MessagesMessage } from "vk-io/lib/api/schemas/objects";
import { MessagesGetByConversationMessageIdResponse, MessagesGetHistoryResponse } from "vk-io/lib/api/schemas/responses";
import { VkResponse } from "./objects";

export async function getVkPrivateChatHistory(
    peerId: number
): Promise<MessagesMessage[]> {
    try {
        const requestInit: RequestInit = {
            method: "GET",
        };

        const url: URL = new URL("https://api.vk.com/method/messages.getHistory");
        url.searchParams.append("access_token", VK_COMMUNITY_API_TOKEN);
        url.searchParams.append("v", VK_API_VERSION);
        url.searchParams.append("peer_id", peerId.toString());
        url.searchParams.append("count", VK_MESSAGE_HISTORY_LIMIT.toString());

        console.log("getVkPrivateChatHistory: url:", url.toString());

        const response: Response = await fetch(url, requestInit);
        const data: VkResponse<MessagesGetHistoryResponse> = await response.json();

        console.log("getVkPrivateChatHistory: data:", data);

        const getHistoryResponse: MessagesGetHistoryResponse | undefined = data.response;

        if (getHistoryResponse && getHistoryResponse.items) {
            return getHistoryResponse.items;
        } else {
            console.error("getVkPrivateChatHistory: Error fetching chat history: data:", data);
            return [];
        }
    } catch (error) {
        console.error("getVkPrivateChatHistory: Error getting chat history: error:", error);
        return [];
    }
}

export async function getVkReplyHistory(
    message: MessagesMessage
): Promise<MessagesMessage[]> {
    const peerId: number | undefined = message.peer_id;
    let conversationMessageId: number | undefined = message.conversation_message_id;

    if (!peerId) {
        console.error("getVkReplyHistory: Error: Missing value: peerId:", peerId);
    }

    if (!conversationMessageId) {
        console.error("getVkReplyHistory: Error: Missing value: conversationMessageId:", conversationMessageId);
    }

    if (!peerId || !conversationMessageId) {
        return [];
    }

    const replyChain: MessagesMessage[] = [];

    while (
        replyChain.length < VK_MESSAGE_HISTORY_LIMIT &&
        conversationMessageId
    ) {
        try {
            const requestInit: RequestInit = {
                method: "GET",
            };

            const url: URL = new URL(
                "https://api.vk.com/method/messages.getByConversationMessageId"
            );
            url.searchParams.append("access_token", VK_COMMUNITY_API_TOKEN);
            url.searchParams.append("v", VK_API_VERSION);
            url.searchParams.append("peer_id", peerId.toString());
            url.searchParams.append(
                "conversation_message_ids",
                conversationMessageId.toString()
            );

            console.log(
                "getVkReplyHistory: url:",
                url.toString()
            );

            const response: Response = await fetch(url, requestInit);
            const data: VkResponse<MessagesGetByConversationMessageIdResponse> = await response.json();
            console.log("getVkReplyHistory: data:", data);

            const foo: MessagesGetByConversationMessageIdResponse | undefined = data.response;
            if (foo && foo.items && foo.items[0]) {
                const fetchedMessage: MessagesMessage = foo.items[0];
                replyChain.push(fetchedMessage);
                conversationMessageId = fetchedMessage.reply_message?.conversation_message_id;
            } else {
                console.error("getVkReplyHistory: Error fetching reply history: data:", data);
                break;
            }
        } catch (error) {
            console.error("getVkReplyHistory: Error fetching reply history: error:", error);
            break;
        }
    }

    console.log("getVkReplyHistory: replyChain:", replyChain);

    return replyChain;
}

export async function getVkForwardHistory(
    message: MessagesMessage
): Promise<MessagesMessage[]> {
    const forwardHistory: MessagesMessage[] | undefined = message.fwd_messages;
    if (!forwardHistory) {
        console.error("getVkForwardHistory: Missing forward messages: message:", message);
        return [message];
    }
    forwardHistory.push(message);
    return forwardHistory.reverse();
}
