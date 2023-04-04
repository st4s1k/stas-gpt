
import {
    UsersGetResponse,
    UsersGetResponseItem,
    VkMessage
} from "../../models/vk";

export function getUniqueUserIdsFromMessage(message: VkMessage): number[] {
    const userIds = new Set<number>();
    accumulateUserIdsFromMessage(message, userIds);
    return Array.from(userIds);
}

function accumulateUserIdsFromMessage(message: VkMessage, userIds: Set<number>): void {
    if (message.from_id && !isBotId(message.from_id)) {
        userIds.add(message.from_id);
    }

    if (message.fwd_messages) {
        for (const fwdMessage of message.fwd_messages) {
            accumulateUserIdsFromMessage(fwdMessage, userIds);
        }
    }

    if (message.reply_message) {
        accumulateUserIdsFromMessage(message.reply_message, userIds);
    }
}

export function getUserName(userId: number): string {
    if (isBotId(userId)) {
        return BOT_MENTION;
    }
    const userName = globalThis.userNames.get(userId);
    if (!userName) {
        console.error("getUserName: userName is undefined for userId:", userId);
        throw new Error(`getUserName: userName is undefined for userId: ${userId}`);
    }
    return userName;
}

export function isBotId(userId: number): boolean {
    if (isNaN(userId)) {
        console.log("isBotId: invalid userId:", userId);
        return false;
    }
    return Math.abs(userId) === BOT_ID;
}

export async function initUserNames(message: VkMessage): Promise<void> {
    try {
        const userNamesString: string | null = await STAS_GPT_KV.get("userNames");
        if (userNamesString) {
            try {
                const userNamesArray = JSON.parse(userNamesString);
                console.log("initUserNames: userNamesArray:", userNamesArray);
                if (Array.isArray(userNamesArray)) {
                    globalThis.userNames = new Map(userNamesArray);
                    console.log("initUserNames: userNames:", userNames.toString());
                    await fetchUnknownUserNames(message);
                } else {
                    console.error("initUserNames: userNames value is not an Array");
                }
            } catch (error) {
                console.error("initUserNames: Error parsing userNames value from KV: error:", error);
                throw new Error(`initUserNames: Error parsing userNames value from KV: error: ${error}`);
            }
        } else {
            globalThis.userNames = new Map();
            console.log("initUserNames: userNames value is null");
        }
    } catch (error) {
        console.error("initUserNames: Error fetching userNames value from KV: error:", error);
        throw new Error(`initUserNames: Error fetching userNames value from KV: error: ${error}`);
    }
    console.log("initUserNames: done");
}

function persistUserNames(): void {
    const userNamesArray = Array.from(globalThis.userNames.entries());
    const userNamesString = JSON.stringify(userNamesArray);
    console.log("persistUserNames: userNamesString:", userNamesString);
    globalThis.event.waitUntil(STAS_GPT_KV.put("userNames", userNamesString));
}

export async function fetchUnknownUserNames(message: VkMessage): Promise<void> {
    const userIds: number[] = getUniqueUserIdsFromMessage(message);
    console.log("fetchUnknownUserNames: userIds:", userIds);

    const userNamesKv: Map<number, string> = globalThis.userNames;
    const unknownUserIds: number[] = userIds.filter((userId: number) => !userNamesKv.get(userId));
    console.log("fetchUnknownUserNames: unknownUserIds:", unknownUserIds);

    if (unknownUserIds.length > 0) {
        const unknownUserNames = await getUsers(unknownUserIds);
        unknownUserNames.forEach((user: UsersGetResponseItem) => {
            userNamesKv.set(user.id, `@${user.screen_name}`);
        });

        console.log("fetchUnknownUserNames: userNamesKv:", userNamesKv);
        globalThis.userNames = userNamesKv;
        console.log("fetchUnknownUserNames: globalThis.userNames:", globalThis.userNames);

        persistUserNames();
    }
    console.log("fetchUnknownUserNames: done");
}

async function getUsers(unknownUserIds: number[]): Promise<UsersGetResponseItem[]> {
    if (unknownUserIds.length === 0) {
        return [];
    }

    const url: URL = new URL("https://api.vk.com/method/users.get");
    url.searchParams.append("access_token", VK_COMMUNITY_API_TOKEN);
    url.searchParams.append("v", VK_API_VERSION);
    url.searchParams.append("user_ids", unknownUserIds.join(","));
    url.searchParams.append("fields", "screen_name");

    console.log("getUsers: url:", url.toString());

    const response = await fetch(url.toString());
    const responseJson: UsersGetResponse = await response.json();

    if (!responseJson.response) {
        console.error("getUsers: Error fetching users:", responseJson);
        throw new Error(`getUsers: Error fetching users: ${responseJson}`);
    }

    console.log("getUsers: responseJson:", responseJson);
    return responseJson.response;
}
