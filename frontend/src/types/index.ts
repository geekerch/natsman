// Domain Types
export interface Template {
  mode: string
  subject: string
  payload: string
  variables?: Record<string, Variable>
}

export interface TreeNode {
  name: string
  path: string
  is_folder: boolean
  children?: TreeNode[]
}

export interface Variable {
  type: 'static' | 'env' | 'dynamic'
  value: string
}

export interface RequestPayload {
  mode: string
  subject: string
  body: string
  variables: Record<string, Variable>
  config: NatsConfig
}

export interface NatsConfig {
  url: string
  creds_path: string
}

export interface SendReqResult {
  reply: string
  message?: string
  status: string
  elapsed: string
}

// JetStream Types
export interface StreamCreateRequest {
  name: string
  subjects: string[]
  storage: string
  replicas: number
  config: NatsConfig
}

export interface StreamConfig {
  name: string
  subjects?: string[]
  storage: string
  replicas: number
}

export interface StreamState {
  messages: number
  bytes: number
  first_seq: number
  last_seq: number
  consumer_count: number
}

export interface StreamInfo {
  config: StreamConfig
  created: string
  state: StreamState
}

// Pub/Sub Types
export interface Subscription {
  subject: string
  message_count?: number
}

export interface SubscriptionMessage {
  subject: string
  payload: string
  reply_to?: string
  timestamp: string
}

export interface SubscribePayload {
  subject: string
  config: NatsConfig
}

// KV Store Types
export interface KVEntry {
  key: string
  value: string
  revision: number
  created: string
  operation: string
}

export interface CreateKVBucketRequest {
  bucket_name: string
  max_history_per_key: number
}

// Profile Types
export interface NatsProfile {
  name: string
  url: string
  creds_path: string
}

export interface GlobalsProfile {
  name: string
  variables: Record<string, Variable>
}
