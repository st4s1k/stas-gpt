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
    conversation_message_ids?: number[];
    message_ids?: number[];
    is_reply: boolean;
}

interface VkMessageSendError {
    error_msg: string;
    message_id?: never;
}

interface VkMessageSendSuccess {
    message_id: number;
    error_msg?: never;
}

export type VkMessageSendResponse = VkMessageSendError | VkMessageSendSuccess;

export interface VkMessage {
    conversation_message_id?: number;
    date?: number;
    from_id?: number;
    id?: number;
    peer_id?: number;
    text?: string;
    reply_message?: VkMessage;
    fwd_messages?: VkMessage[];
}

export interface VkRequestBase {
    type?: string;
}

export interface VkConfirmationRequest extends VkRequestBase {
    group_id?: number;
}

export interface VkMessageNewRequestObject {
    message?: VkMessage;
}

export interface VkMessageNewRequest extends VkRequestBase {
    object?: VkMessageNewRequestObject;
}

export type VkRequest = VkConfirmationRequest | VkMessageNewRequest;

export interface VkGetHistoryResponse {
    items?: VkMessage[];
}

export interface VkGetByConversationMessageIdResponse {
    items?: VkMessage[];
}
