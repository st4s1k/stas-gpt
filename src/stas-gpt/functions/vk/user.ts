
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

        console.log("users.get request URL", url.toString());

        const response: Response = await fetch(url, requestInit);
        const data: any = await response.json();
        console.log("users.get response", data);

        if (data.response && data.response[0]) {
            const user: any = data.response[0];
            // const cleanScreenName = user.screen_name.replace(/[^a-zA-Z0-9]/g, "");
            return `@${user.screen_name}`;
        } else {
            console.error("Error fetching user screen name for id [userId]", data);
            return undefined;
        }
    } catch (error) {
        console.error("Error getting user screen name for id [userId]", error);
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

        console.log("groups.getById request URL", url.toString());

        const response: Response = await fetch(url, requestInit);
        const data: any = await response.json();
        console.log("groups.getById response", data);

        const groupsGetByIdResponse: GroupsGetByIdObjectLegacyResponse =
            data.response;

        if (
            groupsGetByIdResponse &&
            groupsGetByIdResponse[0] &&
            groupsGetByIdResponse[0].id
        ) {
            globalThis.botId = Math.abs(groupsGetByIdResponse[0].id);
        } else {
            console.error("Error fetching bot ID", data);
        }
    } catch (error) {
        console.error("Error getting bot ID", error);
    }
}
