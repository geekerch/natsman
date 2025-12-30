import { RequestPayload, SendReqResult, TreeNode, Template, StreamCreateRequest, StreamInfo, SubscriptionMessage, KVEntry } from '../types/domain';

// Base URL for API - empty for relative path (same origin)
const API_BASE = '/api';

// Helper to access window.go
const getWails = () => (window as any).go?.main?.App;

export const ApiService = {
    // --- Templates ---
    async getTemplates(): Promise<TreeNode> {
        const wails = getWails();
        if (wails) {
            return wails.GetTree();
        }
        const res = await fetch(`${API_BASE}/templates`);
        if (!res.ok) throw new Error('Failed to fetch templates');
        return res.json();
    },

    async getTemplate(path: string): Promise<Template> {
        const wails = getWails();
        if (wails) {
            return wails.GetTemplate(path);
        }
        const res = await fetch(`${API_BASE}/templates/${path}`);
        if (!res.ok) throw new Error('Failed to fetch template');
        return res.json();
    },

    async saveTemplate(path: string, template: Template): Promise<void> {
        const wails = getWails();
        if (wails) {
            return wails.SaveTemplate(path, template);
        }
        const res = await fetch(`${API_BASE}/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, template }),
        });
        if (!res.ok) throw new Error('Failed to save template');
    },

    async createFolder(path: string): Promise<void> {
        const wails = getWails();
        if (wails) {
            return wails.CreateFolder(path);
        }
        // HTTP fallback if needed
    },

    async deleteTemplate(path: string): Promise<void> {
        const wails = getWails();
        if (wails) {
            return wails.DeleteTemplate(path);
        }
        // HTTP fallback
    },

    // --- Requests ---
    async sendRequest(payload: RequestPayload): Promise<SendReqResult> {
        const wails = getWails();
        if (wails) {
            return wails.SendRequest(payload);
        }
        const res = await fetch(`${API_BASE}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to send request');
        return res.json();
    },

    // --- JetStream ---
    async listStreams(): Promise<string[]> {
        const wails = getWails();
        if (wails) {
            return wails.ListJSStreams();
        }
        const res = await fetch(`${API_BASE}/jetstream/streams`);
        if (!res.ok) throw new Error('Failed to list streams');
        const data = await res.json();
        return data.streams || [];
    },

    async getStreamInfo(name: string): Promise<StreamInfo> {
        const wails = getWails();
        if (wails) {
            return wails.GetJSStreamInfo(name);
        }
        const res = await fetch(`${API_BASE}/jetstream/streams/${name}`);
        if (!res.ok) throw new Error('Failed to get stream info');
        return res.json();
    },

    async createStream(req: StreamCreateRequest): Promise<void> {
        const wails = getWails();
        if (wails) {
            return wails.CreateJSStream(req);
        }
        const res = await fetch(`${API_BASE}/jetstream/streams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req),
        });
        if (!res.ok) throw new Error('Failed to create stream');
    },

    async deleteStream(name: string): Promise<void> {
        const wails = getWails();
        if (wails) {
            return wails.DeleteJSStream(name);
        }
        const res = await fetch(`${API_BASE}/jetstream/streams/${name}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete stream');
    },

    async getStreamMessages(stream: string, refresh: boolean = false): Promise<any> {
        const wails = getWails();
        if (wails) {
            return wails.FetchAllStreamMessages(stream, refresh);
        }
        const res = await fetch(`${API_BASE}/jetstream/streams/${stream}/messages?refresh=${refresh}`);
        if (!res.ok) throw new Error('Failed to get stream messages');
        return res.json();
    },

    // --- Pub/Sub ---
    async subscribe(subject: string): Promise<void> {
        const wails = getWails();
        if (wails) {
            return wails.Subscribe({ subject, config: { url: '', creds_path: '' } });
        }
        const res = await fetch(`${API_BASE}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, config: { url: '', creds_path: '' } }),
        });
        if (!res.ok) throw new Error('Failed to subscribe');
    },

    async unsubscribe(subject: string): Promise<void> {
        const wails = getWails();
        if (wails) {
            return wails.Unsubscribe(subject);
        }
        const res = await fetch(`${API_BASE}/unsubscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject }),
        });
        if (!res.ok) throw new Error('Failed to unsubscribe');
    },

    async getSubscriptionMessages(subject: string): Promise<SubscriptionMessage[]> {
        const wails = getWails();
        if (wails) {
            return wails.GetSubscriptionMessages(subject);
        }
        const res = await fetch(`${API_BASE}/subscribe/messages?subject=${encodeURIComponent(subject)}`);
        if (!res.ok) throw new Error('Failed to get messages');
        const data = await res.json();
        return data.messages || [];
    },

    async getActiveSubscriptions(): Promise<string[]> {
        const wails = getWails();
        if (wails) {
            return wails.GetActiveSubscriptions();
        }
        const res = await fetch(`${API_BASE}/subscribe`);
        if (!res.ok) throw new Error('Failed to get subscriptions');
        const data = await res.json();
        return data.subjects || [];
    },

    async clearSubscriptionMessages(subject: string): Promise<void> {
        const wails = getWails();
        if (wails) {
            return wails.ClearSubscriptionMessages(subject);
        }
        const res = await fetch(`${API_BASE}/subscribe/messages?subject=${encodeURIComponent(subject)}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to clear messages');
    },

    // --- KV Store ---
    async listKVBuckets(): Promise<string[]> {
        const wails = getWails();
        if (wails) {
            return wails.ListKVBuckets();
        }
        const res = await fetch(`${API_BASE}/kv/buckets`);
        if (!res.ok) throw new Error('Failed to list KV buckets');
        const data = await res.json();
        return data.buckets || [];
    },

    async createKVBucket(bucket: string, history: number): Promise<void> {
        const wails = getWails();
        if (wails) {
            return wails.CreateKVBucket(bucket, history);
        }
        const res = await fetch(`${API_BASE}/kv/buckets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket_name: bucket, max_history_per_key: history }),
        });
        if (!res.ok) throw new Error('Failed to create KV bucket');
    },

    async deleteKVBucket(bucket: string): Promise<void> {
        const wails = getWails();
        if (wails) {
            return wails.DeleteKVBucket(bucket);
        }
        const res = await fetch(`${API_BASE}/kv/buckets/${bucket}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete KV bucket');
    },

    async getKVKeys(bucket: string): Promise<string[]> {
        const wails = getWails();
        if (wails) {
            return wails.KVKeys(bucket);
        }
        const res = await fetch(`${API_BASE}/kv/buckets/${bucket}/keys`);
        if (!res.ok) throw new Error('Failed to get KV keys');
        const data = await res.json();
        return data.keys || [];
    },

    async getKVValue(bucket: string, key: string): Promise<KVEntry> {
        const wails = getWails();
        if (wails) {
            return wails.KVGet(bucket, key);
        }
        const res = await fetch(`${API_BASE}/kv/buckets/${bucket}/keys/${key}`);
        if (!res.ok) throw new Error('Failed to get KV value');
        const data = await res.json();
        return data.entry;
    },

    async putKVValue(bucket: string, key: string, value: string): Promise<void> {
        const wails = getWails();
        if (wails) {
            return wails.KVPut(bucket, key, value);
        }
        const res = await fetch(`${API_BASE}/kv/buckets/${bucket}/keys/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value }),
        });
        if (!res.ok) throw new Error('Failed to put KV value');
    },

    async deleteKVValue(bucket: string, key: string): Promise<void> {
        const wails = getWails();
        if (wails) {
            return wails.KVDelete(bucket, key);
        }
        const res = await fetch(`${API_BASE}/kv/buckets/${bucket}/keys/${key}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete KV value');
    }
};
