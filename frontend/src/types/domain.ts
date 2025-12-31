export interface Template {
    mode: string;
    subject: string;
    payload: string;
    variables?: Record<string, Variable>;
}

export interface TreeNode {
    name: string;
    path: string;
    is_folder: boolean;
    children?: TreeNode[];
}

export interface Variable {
    type: string;
    value: string;
}

export interface RequestPayload {
    mode: string;
    subject: string;
    body: string;
    variables: Record<string, Variable>;
    config: NatsConfig;
}

export interface NatsConfig {
    url: string;
    creds_path: string;
}

export interface SendReqResult {
    reply: string;
    status: string;
    elapsed: string;
}

export interface StreamCreateRequest {
    name: string;
    subjects: string[];
    storage: string;
    replicas: number;
    config: NatsConfig;
}

export interface StreamConfig {
    name: string;
    subjects?: string[];
    storage: string;
    replicas: number;
}

export interface StreamState {
    messages: number;
    bytes: number;
    first_seq: number;
    last_seq: number;
    consumer_count: number;
}

export interface StreamInfo {
    config: StreamConfig;
    created: string;
    state: StreamState;
}

export interface SubscriptionMessage {
    subject: string;
    data: string;
    timestamp: string;
}

export interface KVEntry {
    key: string;
    value: string;
    revision: number;
    created: string;
    operation: string;
}
