import {
    ChatCompletionRequestMessage,
    ChatCompletionRequestMessageRoleEnum,
    CreateChatCompletionRequest,
    CreateChatCompletionResponse
} from "../../models/openai";

export async function generateChatGPTResponse(
    chatHistory: ChatCompletionRequestMessage[]
): Promise<string> {
    try {
        const systemMessageUserPrompt: ChatCompletionRequestMessage = {
            role: ChatCompletionRequestMessageRoleEnum.User,
            content: OPENAI_CHAT_SYSTEM_MESSAGE,
        };
        const systemMessageBotReply = {
            role: ChatCompletionRequestMessageRoleEnum.Assistant,
            content: "[GPT]: Хорошо, спрашивай.\n[СтасGPT]: Окей! Поехали!",
        };

        const messageHistory: ChatCompletionRequestMessage[] = [];
        messageHistory.push(systemMessageUserPrompt);
        messageHistory.push(systemMessageBotReply);
        messageHistory.push(...Array.from(chatHistory).reverse());

        console.log("generateChatGPTResponse: messageHistory:", messageHistory);

        const createChatCompletionRequest: CreateChatCompletionRequest = {
            model: OPENAI_MODEL,
            messages: messageHistory,
        };

        console.log("generateChatGPTResponse: createChatCompletionRequest:", createChatCompletionRequest);

        const data: CreateChatCompletionResponse | undefined = await fetchGPTResponse(
            createChatCompletionRequest
        );

        if (
            data &&
            data.choices &&
            data.choices[0].message &&
            data.choices[0].message.content
        ) {
            return data.choices[0].message.content.trim();
        } else {
            console.error("generateChatGPTResponse: Error generating GPT response: data:", data);
            throw new Error(`generateChatGPTResponse: Error generating GPT response: data: ${data}`);
        }
    } catch (error) {
        console.error("generateChatGPTResponse: Error generating GPT response: error:", error);
        throw new Error(`generateChatGPTResponse: Error generating GPT response: error: ${error}`);
    } finally {
        console.log("generateChatGPTResponse: done");
    }
}

async function fetchGPTResponse(
    createChatCompletionRequest: CreateChatCompletionRequest
): Promise<CreateChatCompletionResponse> {
    const requestInit: RequestInit = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_TOKEN}`,
        },
        body: JSON.stringify(createChatCompletionRequest),
    };

    console.log("fetchGPTResponse: requestInit:", requestInit);

    try {
        const response: Response = await fetch(OPENAI_API_URL, requestInit);
        const data: CreateChatCompletionResponse = await response.json();
        console.log("fetchGPTResponse: data:", data);
        return data;
    } catch (error) {
        console.error("fetchGPTResponse: Error fetching GPT response: error:", error);
        throw new Error(`fetchGPTResponse: Error fetching GPT response: error: ${error}`);
    }
}
