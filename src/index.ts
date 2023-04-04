/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ShouldNotAnswerError } from "./stas-gpt/exceptions/vk";
import { generateChatGPTResponse } from "./stas-gpt/functions/openai/chat-completion";
import { convertToBotMessages, getMessageId, getPeerId, validateMessage } from "./stas-gpt/functions/utils/message";
import { extractResponse } from "./stas-gpt/functions/utils/string";
import { getVkMessages, initAnsweredMessages, persistAnsweredMessage, sendMessage } from "./stas-gpt/functions/vk/message";
import { initUserNames } from "./stas-gpt/functions/vk/user";
import { ChatCompletionRequestMessage } from "./stas-gpt/models/openai";
import { VkConfirmationRequest, VkMessage, VkMessageNewRequest, VkRequest } from "./stas-gpt/models/vk";

addEventListener("fetch", (event: FetchEvent) => {
    event.respondWith(handleRequest(event));
});

async function handleRequest(event: FetchEvent): Promise<Response> {
    const requestBody = await event.request.json();
    globalThis.event = event;
    return await handleRequestBody(requestBody)
        .catch((error: Error) => {
            console.error("handleRequest: unexpected error:", error);
            throw new Error(`handleRequest: unexpected error: ${error}`);
        });
}

async function handleRequestBody(requestBody: unknown): Promise<Response> {
    if (typeof requestBody !== "object" || requestBody === null || !("type" in requestBody)) {
        console.error("handleRequestBody: Missing requestBody");
        throw new Error("handleRequestBody: Missing requestBody");
    }
    const callbackRequestBody: VkRequest = requestBody as VkRequest;
    console.log("handleRequestBody: requestBody:", callbackRequestBody);
    if (callbackRequestBody.type === "confirmation") {
        const confirmationRequest: VkConfirmationRequest = callbackRequestBody as VkConfirmationRequest;
        if (confirmationRequest.group_id === BOT_ID) {
            return new Response(VK_CONFIRMATION_CODE);
        }
    } else if (callbackRequestBody.type === "message_new") {
        const messageNewRequest: VkMessageNewRequest = callbackRequestBody as VkMessageNewRequest;
        await handleMessageNew(messageNewRequest);
    }
    return new Response("ok");
}

async function handleMessageNew(messageNewRequest: VkMessageNewRequest): Promise<void> {
    try {
        const message: VkMessage | undefined = messageNewRequest.object?.message;
        if (!message) {
            console.error("handleMessageNew: Missing message: messageNewRequest:", messageNewRequest);
            throw new Error(`handleMessageNew: Missing message: messageNewRequest: ${messageNewRequest}`);
        }
        await handleMessage(message);
    } catch (error) {
        if (error instanceof ShouldNotAnswerError) {
            return;
        } else {
            throw error;
        }
    } finally {
        console.log("handleMessageNew: done");
    }
}

async function handleMessage(message: VkMessage): Promise<void> {
    console.log("handleMessage: message:", message);

    validateMessage(message);

    await initAnsweredMessages();
    await initUserNames(message);

    const vkMessageHistory: VkMessage[] = await getVkMessages(message);
    console.log("handleMessage: vkMessageHistory:", vkMessageHistory);
    const botChatHistory: ChatCompletionRequestMessage[] = await convertToBotMessages(vkMessageHistory);
    console.log("handleMessage: botChatHistory:", botChatHistory);
    const botResponse: string = await generateChatGPTResponse(botChatHistory);
    console.log("handleMessage: botResponse:", botResponse);
    const processedBotResponse: string = extractResponse(botResponse);
    console.log("handleMessage: processedBotResponse:", processedBotResponse);
    globalThis.event.waitUntil(handleBotResponse(message, processedBotResponse));
    console.log("handleMessage: done");
}

async function handleBotResponse(
    message: VkMessage,
    botResponse: string
): Promise<void> {
    const peerId: number = getPeerId(message);
    const messageId: number = getMessageId(message);
    let processedBotResponse: string = extractResponse(botResponse);
    if (processedBotResponse === "") {
        processedBotResponse = ERROR_MESSAGE_STRING;
        console.log("handleBotResponse: empty bot response");
    } else {
        console.log("handleBotResponse: processedBotResponse:", processedBotResponse);
    }
    await sendMessage(peerId, messageId, processedBotResponse);
    persistAnsweredMessage(peerId, messageId);
    console.log("handleBotResponse: done");
}
