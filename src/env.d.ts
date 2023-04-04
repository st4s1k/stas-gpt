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
    const BOT_ID: number;
    const ERROR_MESSAGE_STRING: string;

    var event: FetchEvent;
    var answeredMessages: string[] = [];
    var userNames: Map<number, string>;
}

export {};
