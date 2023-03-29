import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum
} from "openai";
import {
  MessagesForeignMessage,
  MessagesMessage
} from "vk-io/lib/api/schemas/objects";
import { getUserName } from "../vk/user";

export async function convertToBotMessages(
  messages: MessagesMessage
): Promise<ChatCompletionRequestMessage[]> {
  return Promise.all(
    messages.map(async (item: MessagesMessage) => await convertToBotMessage(item))
  )
}

async function convertToBotMessage(
  message: MessagesMessage
): Promise<ChatCompletionRequestMessage> {
  const isBot: boolean = Math.abs(message.from_id!) === globalThis.botId;
  const role: ChatCompletionRequestMessageRoleEnum = isBot
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
  indent: number = 0,
  hasContext: boolean = false
): Promise<string> {
  const indentStr: string = "  ".repeat(indent);
  let result: string = "";

  if (message.text) {
    let text: string = hasContext ? `"${message.text}"` : message.text;
    result += formatText(text, indentStr);
  }

  if (message.reply_message || message.fwd_messages) {
    if (!hasContext) {
      result += `${indentStr}\n[контекст]:\n`;
      hasContext = true;
    }
  }

  if (message.reply_message) {
    const userName: string | undefined = await getUserName(
      message.reply_message.from_id
    );
    result += `${indentStr}Отвечая на собщение ${userName!}:\n`;
    result += await formatMessage(
      message.reply_message,
      indent + 1,
      hasContext
    );
  }

  if (message.fwd_messages && message.fwd_messages.length > 0) {
    result += await formatForwardedMessages(
      message.fwd_messages!,
      indent + 1,
      hasContext
    );
  }

  return result;
}

function formatText(text: string, indentStr: string = ""): string {
  return (
    text
      .split("\n")
      .map((line) => `${indentStr}${line}`)
      .join("\n") + "\n"
  );
}

async function formatForwardedMessages(
  fwdMessages: MessagesForeignMessage[],
  indent: number,
  hasContext: boolean
): Promise<string> {
  const indentStr: string = "  ".repeat(indent);

  const formattedMessages: string[] = await Promise.all(
    fwdMessages.map(async (fwdMessage: MessagesForeignMessage) => {
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
