import { RequestPayload, SendReqResult, TreeNode, Template, StreamCreateRequest, StreamInfo } from '../types/domain';

// Base URL for API - empty for relative path (same origin)
const API_BASE = '/api';

export const ApiService = {
    // --- Templates ---
    async getTemplates(): Promise<TreeNode> {
        const res = await fetch(`${API_BASE}/templates`);
        if (!res.ok) throw new Error('Failed to fetch templates');
        return res.json();
    },

    async getTemplate(path: string): Promise<Template> {
        const res = await fetch(`${API_BASE}/templates/${path}`);
        if (!res.ok) throw new Error('Failed to fetch template');
        return res.json();
    },

    async saveTemplate(path: string, template: Template): Promise<void> {
        const res = await fetch(`${API_BASE}/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, template }),
        });
        if (!res.ok) throw new Error('Failed to save template');
    },

    // --- Requests ---
    async sendRequest(payload: RequestPayload): Promise<SendReqResult> {
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
        const res = await fetch(`${API_BASE}/jetstream/streams`);
        if (!res.ok) throw new Error('Failed to list streams');
        const data = await res.json();
        return data.streams || [];
    },

    async getStreamInfo(name: string): Promise<StreamInfo> {
        const res = await fetch(`${API_BASE}/jetstream/streams/${name}`);
        if (!res.ok) throw new Error('Failed to get stream info');
        return res.json();
    },

    async createStream(req: StreamCreateRequest): Promise<void> {
        const res = await fetch(`${API_BASE}/jetstream/streams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req),
        });
        if (!res.ok) throw new Error('Failed to create stream');
    },

    async deleteStream(name: string): Promise<void> {
        const res = await fetch(`${API_BASE}/jetstream/streams/${name}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete stream');
    }
};
