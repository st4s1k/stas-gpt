import {
    ChatCompletionRequestMessage,
    ChatCompletionRequestMessageRoleEnum
} from "openai";
import {
    MessagesMessage
} from "vk-io/lib/api/schemas/objects";
import { getUserName, isBotId } from "../vk/user";

export async function convertToBotMessages(
    messages: MessagesMessage[]
): Promise<ChatCompletionRequestMessage[]> {
    return Promise.all(
        messages.map(async (item: MessagesMessage) => await convertToBotMessage(item))
    );
}

async function convertToBotMessage(
    message: MessagesMessage
): Promise<ChatCompletionRequestMessage> {
    const role: ChatCompletionRequestMessageRoleEnum = isBotId(message.from_id!)
        ? ChatCompletionRequestMessageRoleEnum.Assistant
        : ChatCompletionRequestMessageRoleEnum.User;
    const content: string = await formatMessage(message);
    return {
        role: role,
        content: content,
    };
}

export async function formatMessage(
    message: MessagesMessage,
    indent = 0,
    hasContext = false
): Promise<string> {
    const indentStr: string = "  ".repeat(indent);
    let result = "";

    if (message.text) {
        const text: string = hasContext ? `"${message.text}"` : message.text;
        result += formatText(text, indentStr);
    }

    const replyMessage: MessagesMessage = message.reply_message;
    const fwdMessages: MessagesMessage[] | undefined = message.fwd_messages;
    if (replyMessage || fwdMessages) {
        if (!hasContext) {
            result += `${indentStr}\n[контекст]:\n`;
            hasContext = true;
        }
    }

    if (replyMessage) {
        const userName: string | undefined = await getUserName(
            replyMessage.from_id!
        );
        result += `${indentStr}Отвечая на собщение ${userName!}:\n`;
        result += await formatMessage(
            replyMessage,
            indent + 1,
            hasContext
        );
    }

    if (fwdMessages && fwdMessages.length > 0) {
        result += await formatForwardedMessages(
            fwdMessages,
            indent + 1,
            hasContext
        );
    }

    return result;
}

function formatText(text: string, indentStr = ""): string {
    return (
        text
            .split("\n")
            .map((line) => `${indentStr}${line}`)
            .join("\n") + "\n"
    );
}

async function formatForwardedMessages(
    fwdMessages: MessagesMessage[],
    indent: number,
    hasContext: boolean
): Promise<string> {
    const indentStr: string = "  ".repeat(indent);

    const formattedMessages: string[] = await Promise.all(
        fwdMessages.map(async (fwdMessage: MessagesMessage) => {
            const userName: string | undefined = await getUserName(
                fwdMessage.from_id!
            );
            const formattedMessage: string = await formatMessage(
                fwdMessage,
                indent + 1,
                hasContext
            );
            return `${indentStr}Пересланное собщение от ${userName!}:\n${formattedMessage}`;
        })
    );

    return formattedMessages.join("");
}
