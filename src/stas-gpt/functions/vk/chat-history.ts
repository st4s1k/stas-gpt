import { MessagesMessage } from "vk-io/lib/api/schemas/objects";
import { MessagesGetHistoryResponse } from "vk-io/lib/api/schemas/responses";

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

        console.log("messages.getHistory request URL", url.toString());

        const response: Response = await fetch(url, requestInit);
        const data: any = await response.json();
        console.log("messages.getHistory response", data);

        const getHistoryResponse: MessagesGetHistoryResponse = data.response;

        if (getHistoryResponse && getHistoryResponse.items) {
            return getHistoryResponse.items;
        } else {
            console.error("Error fetching chat history", data);
            return [];
        }
    } catch (error) {
        console.error("Error getting chat history", error);
        return [];
    }
}

export async function getReplyHistory(
    message: MessagesMessage
): Promise<MessagesMessage[]> {
    let replyChain: MessagesMessage[] = [];
    let conversationMessageId: number = message.conversation_message_id!;
    const peerId: number = message.peer_id!;

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
                "messages.getByConversationMessageId request URL",
                url.toString()
            );

            const response: Response = await fetch(url, requestInit);
            const data: any = await response.json();
            console.log("messages.getByConversationMessageId response", data);

            const fetchedMessage: MessagesMessage = data.response.items[0];
            if (fetchedMessage) {
                replyChain.push(fetchedMessage);
                conversationMessageId = fetchedMessage.reply_message?.conversation_message_id;
            } else {
                break;
            }
        } catch (error) {
            console.error("Error fetching reply history", error);
            break;
        }
    }

    console.log("replyChain", replyChain);

    return replyChain;
}

export async function getForwardHistory(
    message: MessagesMessage
): Promise<MessagesMessage[]> {
    const forwardHistory: MessagesMessage[] | undefined = message.fwd_messages;
    if (!forwardHistory) {
        console.error("Missing forward messages")
        return [];
    }
    forwardHistory.push(message);
    return forwardHistory.reverse();
}
