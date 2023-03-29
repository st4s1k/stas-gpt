
import { GroupsGetByIdObjectLegacyResponse } from "vk-io/lib/api/schemas/responses";

export async function getUserName(userId: number): Promise<string | undefined> {
    try {
        userId = Math.abs(userId);
        const isBotMessage: boolean = userId === globalThis.botId;

        if (isBotMessage) {
            return BOT_MENTION;
        }

        const requestInit: RequestInit = {
            method: "GET",
        };

        const url: URL = new URL("https://api.vk.com/method/users.get");
        url.searchParams.append("access_token", VK_COMMUNITY_API_TOKEN);
        url.searchParams.append("v", VK_API_VERSION);
        url.searchParams.append("user_ids", userId.toString());
        url.searchParams.append("fields", "screen_name");

        console.log("getUserName: url:", url.toString());

        const response: Response = await fetch(url, requestInit);
        const data: any = await response.json();
        console.log("getUserName: data:", data);

        if (data.response && data.response[0]) {
            const user: any = data.response[0];
            // const cleanScreenName = user.screen_name.replace(/[^a-zA-Z0-9]/g, "");
            return `@${user.screen_name}`;
        } else {
            console.error(`getUserName: Error fetching user screen name for id [${userId}]: data:`, data);
            return undefined;
        }
    } catch (error) {
        console.error(`getUserName: Error getting user screen name for id [${userId}]: error:`, error);
        return undefined;
    }
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
        const data: any = await response.json();
        console.log("fetchBotId: data:", data);

        const groupsGetByIdResponse: GroupsGetByIdObjectLegacyResponse =
            data.response;

        if (
            groupsGetByIdResponse &&
            groupsGetByIdResponse[0] &&
            groupsGetByIdResponse[0].id
        ) {
            globalThis.botId = Math.abs(groupsGetByIdResponse[0].id);
        } else {
            console.error("fetchBotId: Error fetching bot ID: data:", data);
        }
    } catch (error) {
        console.error("fetchBotId: Error getting bot ID: error:", error);
    }
}
