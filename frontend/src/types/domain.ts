export interface Template {
    mode: string;
    subject: string;
    payload: string;
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

export interface StreamInfo {
    name: string;
    subjects: string[];
    storage: string;
    replicas: number;
}
