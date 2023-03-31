/* eslint-disable no-var */

declare global {
    const OPENAI_API_TOKEN: string;
    const OPENAI_CHAT_SYSTEM_MESSAGE: string;
    const VK_COMMUNITY_API_TOKEN: string;
    const OPENAI_MODEL: string;
    const VK_CONFIRMATION_CODE: string;
    const VK_API_VERSION: string;
    const VK_MESSAGE_HISTORY_LIMIT: number;
    const OPENAI_API_URL: string;
    const STAS_GPT_KV: KVNamespace;
    const RESPONSE_SUBSTRING: string;
    const BOT_MENTION: string;

    var botId: number;
    var answeredMessages: string[] = [];
    var userNames: Record<number, string> = {};
}

export {};
