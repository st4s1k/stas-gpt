export interface VkResponse<T> {
    response: T | undefined;
}

export interface UsersGetResponse {
    response: UsersGetResponseItem[];
}

export interface UsersGetResponseItem {
    id: number;
    screen_name: string;
    first_name: string;
    last_name: string;
    can_access_closed: boolean;
    is_closed: boolean;
}

export interface VkForward {
    peer_id: number;
    conversation_message_ids: number[];
    is_reply: boolean;
}
