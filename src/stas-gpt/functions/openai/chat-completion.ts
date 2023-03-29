import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse
} from "openai";

export async function generateChatGPTResponse(
  chatHistory: ChatCompletionRequestMessage[]
): Promise<string | undefined> {
  try {
    const systemMessage: ChatCompletionRequestMessage = {
      role: ChatCompletionRequestMessageRoleEnum.System,
      content: OPENAI_CHAT_SYSTEM_MESSAGE,
    };

    let messageHistory: ChatCompletionRequestMessage[] = [];
    messageHistory.push(systemMessage);
    messageHistory.push(...Array.from(chatHistory).reverse());

    console.log("messageHistory: ", messageHistory);

    const createChatCompletionRequest: CreateChatCompletionRequest = {
      model: OPENAI_MODEL,
      messages: messageHistory,
    };

    const data: CreateChatCompletionResponse | undefined = await fetchGPTResponse(
      createChatCompletionRequest
    );

    console.log("generateChatGPTResponse response", data);

    if (
      data &&
      data.choices &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      return data.choices[0].message.content.trim();
    } else {
      console.error("Missing data in GPT response", data);
      return undefined;
    }
  } catch (error) {
    console.error("Error generating GPT response", error);
    return undefined;
  }
}

async function fetchGPTResponse(
  createChatCompletionRequest: CreateChatCompletionRequest
): Promise<CreateChatCompletionResponse | undefined> {
  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_TOKEN}`,
    },
    body: JSON.stringify(createChatCompletionRequest),
  };

  console.log("generateChatGPTResponse request", requestInit);
  console.log(
    "generateChatGPTResponse requestBody",
    createChatCompletionRequest
  );

  try {
    const response: Response = await fetch(OPENAI_API_URL, requestInit);
    const data: CreateChatCompletionResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching GPT response', error);
    return undefined;
  }
}
