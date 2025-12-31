import type {
  TreeNode,
  Template,
  RequestPayload,
  SendReqResult,
  StreamInfo,
  StreamCreateRequest,
  SubscriptionMessage,
  SubscribePayload,
  KVEntry,
  NatsProfile,
  GlobalsProfile,
  NatsConfig,
} from '../types'

const API_BASE = '/api'

// Type for Wails Go bindings
declare global {
  interface Window {
    go?: {
      main?: {
        App?: any
      }
    }
  }
}

// Detect if running in Wails desktop mode
const isDesktop = () => {
  return typeof window.go !== 'undefined' && 
         window.go?.main?.App !== undefined
}

class ApiService {
  // Templates
  async getTemplates(): Promise<TreeNode> {
    if (isDesktop()) {
      return await window.go!.main!.App.GetTree()
    }
    const res = await fetch(`${API_BASE}/templates`)
    if (!res.ok) throw new Error('Failed to fetch templates')
    return res.json()
  }

  async getTemplate(path: string): Promise<Template> {
    if (isDesktop()) {
      return await window.go!.main!.App.GetTemplate(path)
    }
    const res = await fetch(`${API_BASE}/templates/${path}`)
    if (!res.ok) throw new Error('Failed to fetch template')
    return res.json()
  }

  async saveTemplate(path: string, template: Template): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.SaveTemplate(path, template)
    }
    const res = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, template }),
    })
    if (!res.ok) throw new Error('Failed to save template')
  }

  async createTemplate(path: string, template: Template): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.CreateTemplate(path, template)
    }
    const res = await fetch(`${API_BASE}/templates/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, template }),
    })
    if (!res.ok) throw new Error('Failed to create template')
  }

  async deleteTemplate(path: string): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.DeleteTemplate(path)
    }
    const res = await fetch(`${API_BASE}/templates/${path}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete template')
  }

  async createFolder(path: string): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.CreateFolder(path)
    }
    const res = await fetch(`${API_BASE}/v1/folders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
    if (!res.ok) throw new Error('Failed to create folder')
  }

  // Requests
  async sendRequest(payload: RequestPayload): Promise<SendReqResult> {
    if (isDesktop()) {
      return await window.go!.main!.App.SendRequest(payload)
    }
    const res = await fetch(`${API_BASE}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to send request')
    return res.json()
  }

  // JetStream
  async listStreams(): Promise<string[]> {
    if (isDesktop()) {
      return await window.go!.main!.App.ListJSStreams()
    }
    const res = await fetch(`${API_BASE}/jetstream/streams`)
    if (!res.ok) throw new Error('Failed to list streams')
    const data = await res.json()
    return data.streams || []
  }

  async getStreamInfo(name: string): Promise<StreamInfo> {
    if (isDesktop()) {
      return await window.go!.main!.App.GetJSStreamInfo(name)
    }
    const res = await fetch(`${API_BASE}/jetstream/streams/${name}`)
    if (!res.ok) throw new Error('Failed to get stream info')
    return res.json()
  }

  async createStream(req: StreamCreateRequest): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.CreateJSStream(req)
    }
    const res = await fetch(`${API_BASE}/jetstream/streams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new Error('Failed to create stream')
  }

  async deleteStream(name: string): Promise<void> {
    if (isDesktop()) {
      const cfg: NatsConfig = { url: '', creds_path: '' }
      return await window.go!.main!.App.DeleteJSStream(name, cfg)
    }
    const res = await fetch(`${API_BASE}/jetstream/streams/${name}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete stream')
  }

  async getStreamMessages(streamName: string, refresh: boolean = false): Promise<any> {
    if (isDesktop()) {
      return await window.go!.main!.App.FetchAllStreamMessages(streamName, refresh)
    }
    const res = await fetch(
      `${API_BASE}/jetstream/streams/${streamName}/messages/all?refresh=${refresh}`
    )
    if (!res.ok) throw new Error('Failed to get stream messages')
    return res.json()
  }

  // Pub/Sub
  async subscribe(payload: SubscribePayload): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.Subscribe(payload)
    }
    const res = await fetch(`${API_BASE}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to subscribe')
  }

  async unsubscribe(subject: string): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.Unsubscribe(subject)
    }
    const res = await fetch(`${API_BASE}/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject }),
    })
    if (!res.ok) throw new Error('Failed to unsubscribe')
  }

  async getSubscriptionMessages(subject: string): Promise<SubscriptionMessage[]> {
    if (isDesktop()) {
      return await window.go!.main!.App.GetSubscriptionMessages(subject)
    }
    const res = await fetch(`${API_BASE}/subscriptions/${subject}/messages`)
    if (!res.ok) throw new Error('Failed to get messages')
    const data = await res.json()
    return data.messages || []
  }

  async getActiveSubscriptions(): Promise<string[]> {
    if (isDesktop()) {
      return await window.go!.main!.App.GetActiveSubscriptions()
    }
    const res = await fetch(`${API_BASE}/subscriptions`)
    if (!res.ok) throw new Error('Failed to get subscriptions')
    const data = await res.json()
    return data.subscriptions || []
  }

  async clearSubscriptionMessages(subject: string): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.ClearSubscriptionMessages(subject)
    }
    const res = await fetch(`${API_BASE}/subscriptions/${subject}/messages`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to clear messages')
  }

  // KV Store
  async listKVBuckets(): Promise<string[]> {
    if (isDesktop()) {
      return await window.go!.main!.App.ListKVBuckets()
    }
    const res = await fetch(`${API_BASE}/kv/buckets`)
    if (!res.ok) throw new Error('Failed to list KV buckets')
    const data = await res.json()
    return data.buckets || []
  }

  async createKVBucket(bucket: string, history: number): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.CreateKVBucket(bucket, history)
    }
    const res = await fetch(`${API_BASE}/kv/buckets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket_name: bucket, max_history_per_key: history }),
    })
    if (!res.ok) throw new Error('Failed to create KV bucket')
  }

  async deleteKVBucket(bucket: string): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.DeleteKVBucket(bucket)
    }
    const res = await fetch(`${API_BASE}/kv/buckets/${bucket}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete KV bucket')
  }

  async getKVKeys(bucket: string): Promise<string[]> {
    if (isDesktop()) {
      return await window.go!.main!.App.KVKeys(bucket)
    }
    const res = await fetch(`${API_BASE}/kv/buckets/${bucket}/keys`)
    if (!res.ok) throw new Error('Failed to get KV keys')
    const data = await res.json()
    return data.keys || []
  }

  async getKVValue(bucket: string, key: string): Promise<KVEntry> {
    if (isDesktop()) {
      return await window.go!.main!.App.KVGet(bucket, key)
    }
    const res = await fetch(`${API_BASE}/kv/buckets/${bucket}/keys/${key}`)
    if (!res.ok) throw new Error('Failed to get KV value')
    const data = await res.json()
    return data.entry
  }

  async putKVValue(bucket: string, key: string, value: string): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.KVPut(bucket, key, value)
    }
    const res = await fetch(`${API_BASE}/kv/buckets/${bucket}/keys/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
    if (!res.ok) throw new Error('Failed to put KV value')
  }

  async deleteKVValue(bucket: string, key: string): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.KVDelete(bucket, key)
    }
    const res = await fetch(`${API_BASE}/kv/buckets/${bucket}/keys/${key}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete KV value')
  }

  // Config & Profiles
  async getNatsConfig(): Promise<NatsConfig> {
    if (isDesktop()) {
      return await window.go!.main!.App.GetNatsConfig()
    }
    const res = await fetch(`${API_BASE}/config`)
    if (!res.ok) throw new Error('Failed to get config')
    return res.json()
  }

  async getNatsProfiles(): Promise<NatsProfile[]> {
    if (isDesktop()) {
      return await window.go!.main!.App.GetNatsProfiles()
    }
    const res = await fetch(`${API_BASE}/profiles/nats`)
    if (!res.ok) throw new Error('Failed to get NATS profiles')
    const data = await res.json()
    return data.profiles || []
  }

  async getActiveNatsProfile(): Promise<string> {
    if (isDesktop()) {
      return await window.go!.main!.App.GetActiveNatsProfile()
    }
    const res = await fetch(`${API_BASE}/profiles/nats`)
    if (!res.ok) throw new Error('Failed to get active profile')
    const data = await res.json()
    return data.active || ''
  }

  async activateNatsProfile(name: string): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.ActivateNatsProfile(name)
    }
    const res = await fetch(`${API_BASE}/profiles/nats/activate/${name}`, {
      method: 'POST',
    })
    if (!res.ok) throw new Error('Failed to activate profile')
  }

  async saveNatsProfile(profile: NatsProfile): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.SaveNatsProfile(profile)
    }
    const res = await fetch(`${API_BASE}/profiles/nats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    if (!res.ok) throw new Error('Failed to save profile')
  }

  async deleteNatsProfile(name: string): Promise<void> {
    if (isDesktop()) {
      return await window.go!.main!.App.DeleteNatsProfile(name)
    }
    const res = await fetch(`${API_BASE}/profiles/nats/${name}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete profile')
  }

  // Global Variables
  async getGlobalVars(): Promise<Record<string, any>> {
    if (isDesktop()) {
      return await window.go!.main!.App.GetGlobalVars()
    }
    const res = await fetch(`${API_BASE}/globals`)
    if (!res.ok) throw new Error('Failed to get globals')
    return res.json()
  }

  async getGlobalsProfiles(): Promise<GlobalsProfile[]> {
    if (isDesktop()) {
      return await window.go!.main!.App.GetGlobalsProfiles()
    }
    const res = await fetch(`${API_BASE}/profiles/globals`)
    if (!res.ok) throw new Error('Failed to get globals profiles')
    const data = await res.json()
    return data.profiles || []
  }

  async getActiveGlobalsProfile(): Promise<string> {
    if (isDesktop()) {
      return await window.go!.main!.App.GetActiveGlobalsProfile()
    }
    const res = await fetch(`${API_BASE}/profiles/globals`)
    if (!res.ok) throw new Error('Failed to get active globals profile')
    const data = await res.json()
    return data.active || ''
  }
}

export const api = new ApiService()
