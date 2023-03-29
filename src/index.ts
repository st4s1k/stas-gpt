import { ChatCompletionRequestMessage } from "openai";
import {
  CallbackMessageNew, MessagesMessage
} from "vk-io/lib/api/schemas/objects";
import { generateChatGPTResponse } from "./stas-gpt/functions/openai/chat-completion";
import { convertToBotMessages as convertToBotChatHistory } from "./stas-gpt/functions/utils/message";
import { extractResponse } from "./stas-gpt/functions/utils/string";
import { getVkMessageHistoryFor, isValidMessage, sendMessage } from "./stas-gpt/functions/vk/message";

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(
  request: Request<unknown, CfProperties<unknown>>
): Promise<Response> {
  const requestBody: any = await request.json();
  console.log("handleRequest: requestBody:", requestBody);

  if (!requestBody) {
    console.error("handleRequest: Missing requestBody");
    return new Response("ok");
  }

  if (requestBody.type === "confirmation") {
    return new Response(VK_CONFIRMATION_CODE);
  } else if (requestBody.type === "message_new") {
    const callbackMessageNew: CallbackMessageNew = requestBody;
    const message: MessagesMessage = callbackMessageNew.object.message;
    console.log('handleRequest: message:', message);
    await handleMessage(message);
    return new Response("ok");
  }

  return new Response("ok");
}

async function handleMessage(message: MessagesMessage): Promise<void> {
  if (!isValidMessage(message)) {
    return;
  }

  const vkChatHistory: MessagesMessage[] = await getVkMessageHistoryFor(message);
  const botChatHistory: ChatCompletionRequestMessage[] = await convertToBotChatHistory(vkChatHistory);
  console.log("handleMessage: botChatHistory:", botChatHistory);

  const botResponse: string | undefined = await generateChatGPTResponse(botChatHistory);

  if (!botResponse) {
    console.error('handleMessage: GPT response is empty or invalid: botResponse:', botResponse);
    return;
  }

  const processedBotResponse: string = extractResponse(botResponse!);
  const peerId = message.peer_id!;
  const messageId = message.id!;
  await sendMessage(peerId, messageId, processedBotResponse);
}
