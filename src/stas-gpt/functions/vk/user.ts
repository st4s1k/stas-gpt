
import { MessagesMessage } from "vk-io/lib/api/schemas/objects";
import { GroupsGetByIdObjectLegacyResponse } from "vk-io/lib/api/schemas/responses";
import { UsersGetResponse, VkResponse } from "./objects";

export function getUniqueUserIdsFromMessage(message: MessagesMessage): number[] {
    const userIds: number[] = [];

    if (message.from_id && !isBotId(message.from_id)) {
        userIds.push(message.from_id);
    }

    if (message.fwd_messages) {
        for (const fwdMessage of message.fwd_messages) {
            const fwdMessageUserIds: number[] = getUniqueUserIdsFromMessage(fwdMessage);
            userIds.push(...fwdMessageUserIds);
        }
    }

    if (message.reply_message) {
        const replyMessageUserIds: number[] = getUniqueUserIdsFromMessage(message.reply_message);
        userIds.push(...replyMessageUserIds);
    }

    return [...new Set(userIds)];
}

export async function getUserName(userId: number): Promise<string | undefined> {
    if (isBotId(userId)) {
        return BOT_MENTION;
    }
    return globalThis.userNames[userId];
}

export async function saveUserName(userId: number, userName: string): Promise<void> {
    globalThis.userNames[userId] = userName;
    const userNamesString: string = JSON.stringify(globalThis.userNames);
    await STAS_GPT_KV.put("userNames", userNamesString);
}

export function isBotId(userId: number): boolean {
    if (isNaN(userId)) {
        console.log("isBotId: invalid userId:", userId);
        return false;
    }
    if (globalThis.botId === undefined || isNaN(globalThis.botId)) {
        console.log("isBotId: invalid botId:", globalThis.botId);
        return false;
    }
    return Math.abs(userId) === globalThis.botId;
}

export async function fetchBotId(): Promise<void> {
    try {
        if (globalThis.botId) {
            return;
        }

        const requestInit: RequestInit = {
            method: "GET",
        };

        const url: URL = new URL("https://api.vk.com/method/groups.getById");
        url.searchParams.append("access_token", VK_COMMUNITY_API_TOKEN);
        url.searchParams.append("v", VK_API_VERSION);

        console.log("fetchBotId: url:", url.toString());

        const response: Response = await fetch(url, requestInit);
        const data: VkResponse<GroupsGetByIdObjectLegacyResponse> = await response.json();
        console.log("fetchBotId: data:", data);

        if (response.ok && data.response) {
            const groupsGetByIdResponse: GroupsGetByIdObjectLegacyResponse =
                data.response;

            if (groupsGetByIdResponse[0] && groupsGetByIdResponse[0].id) {
                globalThis.botId = Math.abs(groupsGetByIdResponse[0].id);
            } else {
                console.error(
                    "fetchBotId: Error fetching bot ID: groupsGetByIdResponse:",
                    groupsGetByIdResponse
                );
            }
        } else {
            console.error(
                "fetchBotId: Error fetching bot ID: data.response:",
                data.response
            );
        }
    } catch (error) {
        console.error("fetchBotId: Error getting bot ID: error:", error);
    }
}

export async function fetchUserNamesKv() {
    try {
        const userNamesString: string | null = await STAS_GPT_KV.get("userNames");
        if (userNamesString) {
            try {
                const userNames = JSON.parse(userNamesString);
                if (Array.isArray(userNames)) {
                    globalThis.userNames = userNames;
                } else {
                    globalThis.userNames = [];
                }
            } catch (error) {
                console.error("fetchUserNames: Error parsing userNames value from KV: error:", error);
                globalThis.userNames = [];
            }
        } else {
            console.log("fetchUserNames: userNames value is null");
            globalThis.userNames = [];
        }
    } catch (error) {
        console.error("fetchUserNames: Error fetching userNames value from KV: error:", error);
        globalThis.userNames = [];
    }
}

export async function persistUserNames(): Promise<void> {
    return STAS_GPT_KV.put("userNames", JSON.stringify(globalThis.userNames));
}

export async function fetchUnknownUserNames(message: MessagesMessage) {
    const userIds: number[] = getUniqueUserIdsFromMessage(message);
    const userNamesKv: Record<number, string> = globalThis.userNames;
    const unknownUserIds: number[] = userIds.filter((userId) => !userNamesKv[userId]);

    if (unknownUserIds.length > 0) {
        const requestInit: RequestInit = {
            method: "GET",
        };

        const url: URL = new URL("https://api.vk.com/method/users.get");
        url.searchParams.append("access_token", VK_COMMUNITY_API_TOKEN);
        url.searchParams.append("v", VK_API_VERSION);
        url.searchParams.append("user_ids", unknownUserIds.join(","));
        url.searchParams.append("fields", "screen_name");

        const response: Response = await fetch(url.toString(), requestInit);
        const responseJson: UsersGetResponse = await response.json();

        if (responseJson.response) {
            responseJson.response.forEach((user) => {
                userNamesKv[user.id] = `@${user.screen_name}`;
            });
        }

        globalThis.userNames = userNamesKv;
    }
}
