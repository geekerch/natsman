const API_BASE = '';

// Adapter to switch between Wails RPC (Desktop) and REST API (Server)
const Backend = {
    isDesktop: () => window.go && window.go.main && window.go.main.App,

    // Config
    async getConfig() {
        if (this.isDesktop()) return await window.go.main.App.GetNatsConfig();
        const res = await fetch(API_BASE + '/api/config');
        return await res.json();
    },

    // Globals
    async getGlobals() {
        if (this.isDesktop()) return await window.go.main.App.GetGlobalVars();
        const res = await fetch(API_BASE + '/api/globals');
        return await res.json();
    },

    // Profiles
    async getGlobalsProfiles() {
        if (this.isDesktop()) {
            return {
                profiles: await window.go.main.App.GetGlobalsProfiles(),
                active: await window.go.main.App.GetActiveGlobalsProfile()
            };
        }
        const res = await fetch(API_BASE + '/api/profiles/globals');
        return await res.json();
    },

    async getNatsProfiles() {
        if (this.isDesktop()) {
            return {
                profiles: await window.go.main.App.GetNatsProfiles(),
                active: await window.go.main.App.GetActiveNatsProfile()
            };
        }
        const res = await fetch(API_BASE + '/api/profiles/nats');
        return await res.json();
    },

    async switchGlobalsProfile(name) {
        if (this.isDesktop()) return await window.go.main.App.ActivateGlobalsProfile(name);
        await fetch(`${API_BASE}/api/profiles/globals/activate/${name}`, { method: 'POST' });
    },

    async switchNatsProfile(name) {
        if (this.isDesktop()) return await window.go.main.App.ActivateNatsProfile(name);
        await fetch(`${API_BASE}/api/profiles/nats/activate/${name}`, { method: 'POST' });
    },

    async saveGlobalsProfile(profile) {
        if (this.isDesktop()) return await window.go.main.App.SaveGlobalsProfile(profile);
        await fetch(API_BASE + '/api/profiles/globals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
    },

    async deleteGlobalsProfile(name) {
        if (this.isDesktop()) return await window.go.main.App.DeleteGlobalsProfile(name);
        await fetch(`${API_BASE}/api/profiles/globals/${name}`, { method: 'DELETE' });
    },

    async saveNatsProfile(profile) {
        if (this.isDesktop()) return await window.go.main.App.SaveNatsProfile(profile);
        await fetch(API_BASE + '/api/profiles/nats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
    },

    async deleteNatsProfile(name) {
        if (this.isDesktop()) return await window.go.main.App.DeleteNatsProfile(name);
        await fetch(`${API_BASE}/api/profiles/nats/${name}`, { method: 'DELETE' });
    },

    // JS Extensions
    async getJSExtensions() {
        if (this.isDesktop()) {
            return {
                available: await window.go.main.App.ListJSExtensions(),
                active: await window.go.main.App.GetActiveJSExtensions()
            };
        }
        const res = await fetch(API_BASE + '/api/extensions');
        return await res.json();
    },

    async setActiveJSExtensions(extensions) {
        if (this.isDesktop()) return await window.go.main.App.SetActiveJSExtensions(extensions);
        await fetch(API_BASE + '/api/extensions/activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ extensions })
        });
    },

    // Tree / Templates
    async getTree() {
        if (this.isDesktop()) return await window.go.main.App.GetTree();
        const res = await fetch(API_BASE + '/api/templates');
        return await res.json();
    },

    async getTemplate(path) {
        if (this.isDesktop()) return await window.go.main.App.GetTemplate(path);
        const res = await fetch(API_BASE + `/api/templates/${path}`);
        return await res.json();
    },

    async saveTemplate(path, template) {
        if (this.isDesktop()) return await window.go.main.App.SaveTemplate(path, template);
        const res = await fetch(API_BASE + '/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, template })
        });
        if (!res.ok) throw new Error(await res.text());
        return res;
    },

    async createTemplate(path, template) {
        if (this.isDesktop()) return await window.go.main.App.CreateTemplate(path, template);
        const res = await fetch(API_BASE + '/api/templates/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, template })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create template');
        }
        return res;
    },

    async deleteTemplate(path) {
        if (this.isDesktop()) return await window.go.main.App.DeleteTemplate(path);
        await fetch(API_BASE + `/api/templates/${path}`, { method: 'DELETE' });
    },

    async createFolder(path) {
        if (this.isDesktop()) return await window.go.main.App.CreateFolder(path);
        const res = await fetch(API_BASE + '/api/v1/folders/create', {
            method: 'POST',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create folder');
        }
    },


    async moveTemplate(from, to) {
        if (this.isDesktop()) return await window.go.main.App.MoveTemplate(from, to);
        await fetch(API_BASE + '/api/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to })
        });
    },

    // Logic
    async parseVariables(content) {
        if (this.isDesktop()) return await window.go.main.App.ExtractVariables(content);
        const res = await fetch(API_BASE + '/api/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        return await res.json();
    },

    async sendRequest(reqPayload) {
        if (this.isDesktop()) return await window.go.main.App.SendRequest(reqPayload);
        const res = await fetch(API_BASE + '/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqPayload)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
        }
        return await res.json();
    },

    async evalDynamicScript(script) {
        if (this.isDesktop()) return await window.go.main.App.EvalDynamicScript(script);
        const res = await fetch(API_BASE + '/api/variables/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script })
        });
        const data = await res.json(); // API returns { result: "..." } or { error: "..." }
        if (data.error) throw new Error(data.error);
        return data.result;
    },

    // Pub/Sub
    async subscribe(payload) {
        if (this.isDesktop()) return await window.go.main.App.Subscribe(payload);
        const res = await fetch(API_BASE + '/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    async unsubscribe(subject) {
        if (this.isDesktop()) return await window.go.main.App.Unsubscribe(subject);
        const res = await fetch(API_BASE + '/api/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    async getActiveSubscriptions() {
        if (this.isDesktop()) return await window.go.main.App.GetActiveSubscriptions();
        const res = await fetch(API_BASE + '/api/subscriptions');
        const data = await res.json();
        return data.subscriptions || [];
    },

    async getSubscriptionMessages(subject) {
        if (this.isDesktop()) return await window.go.main.App.GetSubscriptionMessages(subject);
        const res = await fetch(API_BASE + `/api/subscriptions/${encodeURIComponent(subject)}/messages`);
        const data = await res.json();
        return data.messages || [];
    },

    async clearSubscriptionMessages(subject) {
        if (this.isDesktop()) return await window.go.main.App.ClearSubscriptionMessages(subject);
        const res = await fetch(API_BASE + `/api/subscriptions/${encodeURIComponent(subject)}/messages`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    // JetStream
    async createJSStream(req) {
        if (this.isDesktop()) return await window.go.main.App.CreateJSStream(req);
        const res = await fetch(API_BASE + '/api/jetstream/streams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    async listJSStreams() {
        if (this.isDesktop()) return await window.go.main.App.ListJSStreams();
        const res = await fetch(API_BASE + '/api/jetstream/streams');
        const data = await res.json();
        return data.streams || [];
    },

    async getJSStreamInfo(name) {
        if (this.isDesktop()) return await window.go.main.App.GetJSStreamInfo(name);
        const res = await fetch(API_BASE + `/api/jetstream/streams/${encodeURIComponent(name)}`);
        return await res.json();
    },

    async deleteJSStream(name) {
        if (this.isDesktop()) return await window.go.main.App.DeleteJSStream(name);
        const res = await fetch(API_BASE + `/api/jetstream/streams/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    async jsPublish(req) {
        if (this.isDesktop()) return await window.go.main.App.JSPublish(req);
        const res = await fetch(API_BASE + '/api/jetstream/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    async createJSConsumer(req) {
        if (this.isDesktop()) return await window.go.main.App.CreateJSConsumer(req);
        const res = await fetch(API_BASE + '/api/jetstream/consumers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    async deleteJSConsumer(streamName, consumerName) {
        if (this.isDesktop()) return await window.go.main.App.DeleteJSConsumer(streamName, consumerName);
        const res = await fetch(API_BASE + `/api/jetstream/consumers/${encodeURIComponent(streamName)}/${encodeURIComponent(consumerName)}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    async getStreamMessages(streamName, limit = 10, startSeq = 1) {
        if (this.isDesktop()) {
            return await window.go.main.App.GetStreamMessages({
                stream_name: streamName,
                limit: limit,
                start_seq: startSeq,
                config: {}
            });
        }
        const res = await fetch(API_BASE + `/api/jetstream/streams/${encodeURIComponent(streamName)}/messages?limit=${limit}&start_seq=${startSeq}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    async fetchAllStreamMessages(streamName, refresh = false) {
        if (this.isDesktop()) {
            return await window.go.main.App.FetchAllStreamMessages(streamName, refresh);
        }
        const res = await fetch(API_BASE + `/api/jetstream/streams/${encodeURIComponent(streamName)}/messages/all?refresh=${refresh}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    // KV
    async listKVBuckets() {
        if (this.isDesktop()) return await window.go.main.App.ListKVBuckets();
        const res = await fetch(API_BASE + '/api/kv/buckets');
        const data = await res.json();
        return data.buckets || [];
    },

    async createKVBucket(name, config = {}) {
        if (this.isDesktop()) return await window.go.main.App.CreateKVBucket(name, config);
        const res = await fetch(API_BASE + '/api/kv/buckets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, config })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    async deleteKVBucket(name) {
        if (this.isDesktop()) return await window.go.main.App.DeleteKVBucket(name);
        const res = await fetch(API_BASE + `/api/kv/buckets/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    async listKVKeys(bucket) {
        if (this.isDesktop()) return await window.go.main.App.ListKVKeys(bucket);
        const res = await fetch(API_BASE + `/api/kv/buckets/${encodeURIComponent(bucket)}/keys`);
        const data = await res.json();
        return data.keys || [];
    },

    async getKV(bucket, key) {
        if (this.isDesktop()) return await window.go.main.App.GetKV(bucket, key);
        const res = await fetch(API_BASE + `/api/kv/buckets/${encodeURIComponent(bucket)}/keys/${encodeURIComponent(key)}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    async putKV(bucket, key, value) {
        if (this.isDesktop()) return await window.go.main.App.PutKV(bucket, key, value);
        const res = await fetch(API_BASE + `/api/kv/buckets/${encodeURIComponent(bucket)}/keys/${encodeURIComponent(key)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    async deleteKV(bucket, key) {
        if (this.isDesktop()) return await window.go.main.App.DeleteKV(bucket, key);
        const res = await fetch(API_BASE + `/api/kv/buckets/${encodeURIComponent(bucket)}/keys/${encodeURIComponent(key)}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    }
};

const app = {
    state: {
        tree: null,
        expandedFolders: new Set(),
        currentPath: null,
        currentTemplate: null,
        draftItem: null,
        searchQuery: '',
        // Profiles
        selectedFolder: null,
        globalVars: {},
        localVars: {},
        sidebarCollapsed: false,
        sidebarWidth: 260,
        responseHeight: 200,
        draftItem: null,
        // Profiles
        globalsProfiles: [],
        activeGlobalsProfile: '',
        natsProfiles: [],
        activeNatsProfile: '',
        // JS Extensions
        availableExtensions: [],
        activeExtensions: [],
        // Pub/Sub
        mode: 'request', // 'request', 'pubsub', or 'jetstream'
        activeSubscriptions: [],
        selectedSubscription: null,
        subscriptionMessages: {},
        messageRefreshInterval: null,
        // JetStream
        jsStreams: [],
        jsSelectedStream: null,
        currentStreamName: null,
        currentPage: 1,
        currentStartSeq: 1,
        currentMessagesResult: null,
        loadingMessages: false,
        allMessages: [],
        // KV
        kvBuckets: [],
        currentKVBucket: null,
        selectedProfile: null
    },

    showToast: (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        if (!container) return; // Should not happen

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px) translateX(20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        container.appendChild(toast);
    },

    showConfirm: (message) => {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            const msgEl = document.getElementById('confirm-message');
            const okBtn = document.getElementById('confirm-ok-btn');
            const cancelBtn = document.getElementById('confirm-cancel-btn');
            const closeBtn = document.getElementById('confirm-close');
            const backdrop = modal.querySelector('.modal-backdrop');

            if (!modal) return resolve(false);

            msgEl.textContent = message;
            modal.classList.add('active');

            // Clean up event listeners
            const cleanup = () => {
                modal.classList.remove('active');
                okBtn.onclick = null;
                cancelBtn.onclick = null;
                closeBtn.onclick = null;
                backdrop.onclick = null;
                window.removeEventListener('keydown', onKey);
            };

            const onConfirm = () => {
                cleanup();
                resolve(true);
            };

            const onCancel = () => {
                cleanup();
                resolve(false);
            };

            const onKey = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancel();
                }
                if (e.key === 'Enter') {
                    // Only confirm if not focusing other inputs (but modal has no other inputs)
                    e.preventDefault();
                    onConfirm();
                }
            };

            okBtn.onclick = onConfirm;
            cancelBtn.onclick = onCancel;
            closeBtn.onclick = onCancel;
            backdrop.onclick = onCancel;

            window.addEventListener('keydown', onKey);

            // Focus OK button for keyboard navigation
            setTimeout(() => okBtn.focus(), 50);
        });
    },

    init: async () => {
        // app.showToast('[Init] Starting...'); // Uncomment if needed, but might be too spammy.
        console.log('[Init] Starting initialization...');
        try {
            console.log('[Init] Loading NATS profiles...');
            await app.loadNatsProfiles();
            console.log('[Init] Loading Globals profiles...');
            await app.loadGlobalsProfiles();
            console.log('[Init] Loading Config...');
            await app.loadConfig();
            console.log('[Init] Loading Globals...');
            await app.loadGlobals();
            console.log('[Init] Loading Tree...');
            await app.loadTree();
            console.log('[Init] Setting up event listeners...');
            app.setupEventListeners();
            console.log('[Init] Init resize handles...');
            app.initResizeHandles();

            // Set response panel to default height
            const responsePanel = document.getElementById('response-panel');
            if (responsePanel) {
                responsePanel.style.height = `${app.state.responseHeight}px`;
            }
            console.log('[Init] Initialization complete.');
        } catch (e) {
            console.error('[Init] CRITICAL ERROR during init:', e);
            app.showToast('App Initialization Failed: ' + e.toString());
        }
    },

    // API Calls
    loadConfig: async () => {
        try {
            const cfg = await Backend.getConfig();
            document.getElementById('config-url').value = cfg.url || '';
            document.getElementById('config-creds').value = cfg.creds_path || '';
        } catch (e) {
            console.error('Failed to load config:', e);
        }
    },

    loadGlobals: async () => {
        try {
            app.state.globalVars = await Backend.getGlobals() || {};
        } catch (e) {
            console.error('Failed to load globals:', e);
        }
    },

    // Profile Management
    loadGlobalsProfiles: async () => {
        try {
            const data = await Backend.getGlobalsProfiles();
            app.state.globalsProfiles = data.profiles || [];
            app.state.activeGlobalsProfile = data.active || '';
        } catch (e) {
            console.error('Failed to load globals profiles:', e);
        }
    },

    loadNatsProfiles: async () => {
        try {
            const data = await Backend.getNatsProfiles();
            app.state.natsProfiles = data.profiles || [];
            app.state.activeNatsProfile = data.active || '';
            app.state.selectedProfile = data.active || '';
        } catch (e) {
            console.error('Failed to load NATS profiles:', e);
        }
    },

    switchGlobalsProfile: async (profileName) => {
        try {
            await Backend.switchGlobalsProfile(profileName);
            app.state.activeGlobalsProfile = profileName;
            await app.loadGlobals();
        } catch (e) {
            console.error('Failed to switch globals profile:', e);
        }
    },

    switchNatsProfile: async (profileName) => {
        try {
            await Backend.switchNatsProfile(profileName);
            app.state.activeNatsProfile = profileName;
            app.state.selectedProfile = profileName;
            await app.loadConfig();
        } catch (e) {
            console.error('Failed to switch NATS profile:', e);
        }
    },

    loadTree: async () => {
        try {
            const tree = await Backend.getTree();
            app.state.tree = tree;
            app.renderTree();
            return tree;
        } catch (e) {
            document.getElementById('template-list').innerHTML = '<div class="error-message">Failed to load templates</div>';
        }
    },

    filterNodes: (nodes, query) => {
        if (!nodes) return [];
        const lowerQuery = query.toLowerCase();
        const result = [];

        nodes.forEach(node => {
            if (node.is_folder) {
                const filteredChildren = app.filterNodes(node.children, query);
                const nameMatches = node.name.toLowerCase().includes(lowerQuery);

                if (nameMatches || filteredChildren.length > 0) {
                    // Clone node to avoid mutating original tree state
                    const newNode = { ...node, children: filteredChildren };
                    result.push(newNode);
                }
            } else {
                if (node.name.toLowerCase().includes(lowerQuery) || node.path.toLowerCase().includes(lowerQuery)) {
                    result.push(node);
                }
            }
        });
        return result;
    },

    // Tree Rendering
    renderTree: () => {
        const list = document.getElementById('template-list');
        list.innerHTML = '';

        if (!app.state.tree || !app.state.tree.children || app.state.tree.children.length === 0) {
            if (!app.state.draftItem) {
                list.innerHTML = `
                    <div style="padding: 20px 12px; text-align: center; color: var(--text-muted); font-size: 11px;">
                        No templates yet<br/>Click icons above to create
                    </div>
                `;
                // No return here, as we might still render a draft item
            }
        }

        // Render draft item if exists
        if (app.state.draftItem) {
            list.appendChild(app.createDraftNode(app.state.draftItem));
        }

        // Render existing tree
        if (app.state.tree && app.state.tree.children) {
            let nodesToRender = app.state.tree.children;
            if (app.state.searchQuery) {
                nodesToRender = app.filterNodes(nodesToRender, app.state.searchQuery);
            }

            nodesToRender.forEach(node => {
                list.appendChild(app.createTreeNode(node, 0));
            });
        }
    },

    createDraftNode: (draft) => {
        const container = document.createElement('div');
        container.className = 'tree-node draft';

        const item = document.createElement('div');
        item.className = 'tree-item active';
        item.style.paddingLeft = '8px';
        item.style.opacity = '0.7';

        // Toggle (empty for draft)
        const toggle = document.createElement('span');
        toggle.className = 'tree-toggle hidden';

        // Icon
        const icon = document.createElement('span');
        icon.className = 'tree-icon';
        if (draft.isFolder) {
            icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M2 3h4l2 2h6v8H2V3z"/>
            </svg>`;
        } else {
            icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 1h7l3 3v10H3V1zM10 1v3h3"/>
            </svg>`;
        }

        // Name (input for editing)
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'tree-name-input';
        nameInput.placeholder = draft.isFolder ? 'Folder name...' : 'Request name...';
        nameInput.value = draft.path || '';
        nameInput.style.flex = '1';
        nameInput.style.background = 'var(--bg-tertiary)';
        nameInput.style.border = '1px solid var(--border-focus)';
        nameInput.style.borderRadius = '3px';
        nameInput.style.padding = '3px 6px';
        nameInput.style.color = 'var(--text-primary)';
        nameInput.style.fontSize = '13px';

        nameInput.oninput = (e) => {
            draft.path = e.target.value;
            app.state.currentPath = e.target.value;
        };

        nameInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                if (draft.isFolder) {
                    app.createFolderFromDraft();
                } else {
                    // Save the file
                    app.saveTemplate();
                }
            } else if (e.key === 'Escape') {
                app.cancelDraft();
            }
        };

        // Auto-focus
        setTimeout(() => nameInput.focus(), 100);

        item.appendChild(toggle);
        item.appendChild(icon);
        item.appendChild(nameInput);
        container.appendChild(item);

        return container;
    },

    createTreeNode: (node, level) => {
        const container = document.createElement('div');
        container.className = 'tree-node';
        container.dataset.path = node.path;

        const item = document.createElement('div');
        item.className = `tree-item ${app.state.currentPath === node.path ? 'active' : ''}`;
        item.style.paddingLeft = `${8 + level * 16}px`;
        item.title = node.path; // Tooltip for collapsed mode

        // Toggle arrow (only for folders)
        const toggle = document.createElement('span');
        toggle.className = `tree-toggle ${node.is_folder ? '' : 'hidden'} ${app.state.expandedFolders.has(node.path) ? 'expanded' : ''}`;
        toggle.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M2 1L7 5L2 9V1Z"/></svg>`;
        if (node.is_folder) {
            toggle.onclick = (e) => {
                e.stopPropagation();
                app.toggleFolder(node.path);
            };
        }

        // Icon
        const icon = document.createElement('span');
        icon.className = 'tree-icon';
        if (node.is_folder) {
            icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M2 3h4l2 2h6v8H2V3z"/>
            </svg>`;
        } else {
            icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 1h7l3 3v10H3V1zM10 1v3h3"/>
            </svg>`;
        }
        // Name
        const name = document.createElement('span');
        name.className = 'tree-name';
        name.textContent = node.name;
        // name.onclick removed to prevent accidental renames

        // Actions
        const actions = document.createElement('div');
        actions.className = 'tree-actions';
        actions.style.display = 'none'; // Show on hover (css needed) or always? User didn't specify, but sidebar usually hover.
        // Actually, let's make it flex-end
        actions.style.marginLeft = 'auto';
        actions.style.paddingRight = '5px';
        actions.style.display = 'flex';
        actions.style.gap = '4px';

        // Rename (Both)
        const renameBtn = document.createElement('span');
        renameBtn.className = 'action-icon rename';
        renameBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 10.5h1.5l6-6-1.5-1.5-6 6v1.5z M10.5 3l-1.5-1.5"/>
        </svg>`;
        renameBtn.title = "Rename";
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            app.enableInlineRename(node, name);
        };
        actions.appendChild(renameBtn);

        // Add File (Folder Only)
        if (node.is_folder) {
            const addBtn = document.createElement('span');
            addBtn.className = 'action-icon add-file';
            addBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2v8M2 6h8"/>
            </svg>`;
            addBtn.title = "New File in Folder";
            addBtn.onclick = (e) => {
                e.stopPropagation();
                app.addFileToFolder(node.path);
            };
            actions.appendChild(addBtn);
        }

        // Delete (Both)
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'action-icon delete';
        deleteBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h8M6 3v6M4 3V2h4v1"/>
        </svg>`;
        deleteBtn.title = "Delete";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            app.deleteItem(node);
        };
        actions.appendChild(deleteBtn);

        item.appendChild(toggle);
        item.appendChild(icon);
        item.appendChild(name);
        item.appendChild(actions);

        // Click handler
        if (!node.is_folder) {
            item.onclick = () => {
                console.log('[TreeNode] File clicked:', node.path);
                app.selectTemplate(node.path);
            };
        } else {
            item.onclick = (e) => {
                // Clicking folder row (not name/toggle) allows selecting folder context? 
                // Or just toggle. Let's make it toggle for now if not click name.
                if (e.target !== actions && !actions.contains(e.target) && e.target !== name && e.target.tagName !== 'INPUT') {
                    app.toggleFolder(node.path);
                }
            };
        }

        container.appendChild(item);

        // Render children if expanded or searching
        if (node.is_folder && (app.state.expandedFolders.has(node.path) || app.state.searchQuery) && node.children) {
            node.children.forEach(child => {
                container.appendChild(app.createTreeNode(child, level + 1));
            });
        }

        return container;
    },

    // New Helper Functions
    enableInlineRename: (node, nameElement) => {
        const originalName = node.name;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalName;
        input.className = 'tree-name-input'; // Reuse style
        input.style.flex = '1';
        input.style.minWidth = '50px';

        // Replace span with input
        nameElement.replaceWith(input);
        input.focus();
        input.select();

        // Prevent click bubbling
        input.onclick = (e) => e.stopPropagation();

        const commitRename = async () => {
            const newName = input.value.trim();
            if (!newName || newName === originalName) {
                input.replaceWith(nameElement);
                return;
            }

            await app.performRename(node, newName);
        };

        input.onkeydown = async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur(); // Triggers onblur
            } else if (e.key === 'Escape') {
                input.replaceWith(nameElement);
            }
        };

        input.onblur = () => {
            commitRename();
        };
    },

    performRename: async (node, newName) => {
        const parentPath = node.path.substring(0, node.path.lastIndexOf(node.name));
        let newPath = parentPath + newName;

        try {
            await Backend.moveTemplate(node.path, newPath);
            await app.loadTree();
            if (app.state.currentPath === node.path) {
                app.state.currentPath = newPath;
            }
        } catch (e) {
            app.showToast('Rename failed: ' + e);
            app.renderTree(); // Revert UI
        }
    },

    deleteItem: async (node) => {
        const type = node.is_folder ? 'folder' : 'file';
        if (!await app.showConfirm(`Are you sure you want to delete ${type} "${node.name}"?`)) return;

        try {
            await Backend.deleteTemplate(node.path);
            await app.loadTree();
            if (app.state.currentPath === node.path) {
                app.state.currentPath = null;
                // Clear editor?
            }
        } catch (e) {
            app.showToast('Delete failed: ' + e);
        }
    },

    toggleFolder: (path) => {
        if (app.state.expandedFolders.has(path)) {
            app.state.expandedFolders.delete(path);
        } else {
            app.state.expandedFolders.add(path);
        }
        app.renderTree();
    },

    selectTemplate: async (path) => {
        console.log('[selectTemplate] Called with path:', path);
        try {
            console.log('[selectTemplate] Fetching template...');
            const template = await Backend.getTemplate(path);
            console.log('[selectTemplate] Template loaded:', template);

            app.state.currentPath = path;
            app.state.currentTemplate = template;
            app.state.draftItem = null; // Clear draft

            // Update UI
            document.getElementById('template-name').value = path.split('/').pop();
            document.getElementById('subject-input').value = template.subject || '';
            document.getElementById('payload-input').value = template.payload || '';
            
            // Set mode
            const mode = template.mode || 'request';
            app.state.mode = mode;
            document.getElementById('mode-select').value = mode;
            app.onModeChange();

            app.state.localVars = {};
            app.renderTree();
            app.parseVariables();
            console.log('[selectTemplate] Template loaded successfully');
        } catch (e) {
            console.error('[selectTemplate] Failed to load template:', e);
            app.showToast(`Failed to load template: ${e.message}`, 'error');
        }
    },

    addFileToFolder: (folderPath) => {
        if (!app.state.expandedFolders.has(folderPath)) {
            app.state.expandedFolders.add(folderPath);
            app.renderTree();
        }

        const folderNode = document.querySelector(`.tree-node[data-path="${folderPath.replace(/"/g, '\\"')}"]`);
        if (!folderNode) return;

        const draftContainer = document.createElement('div');
        draftContainer.className = 'tree-node draft-node';

        const item = document.createElement('div');
        item.className = 'tree-item';
        // Simple indentation math or just fixed? Inherit from folder?
        // Let's use computed style or just guess. 
        // 8px base + (level+1)*16.
        // We can check folderNode's padding?
        // Simplest: 24px + folderNode padding.
        const parentPadding = parseInt(folderNode.querySelector('.tree-item').style.paddingLeft) || 8;
        item.style.paddingLeft = `${parentPadding + 16}px`;

        const icon = document.createElement('span');
        icon.className = 'tree-icon';
        icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 1h7l3 3v10H3V1zM10 1v3h3"/></svg>`;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tree-name-input';
        input.placeholder = 'New File';
        input.value = 'new_request';
        input.style.flex = '1';

        item.appendChild(icon);
        item.appendChild(input);
        draftContainer.appendChild(item);

        folderNode.appendChild(draftContainer);

        input.focus();
        input.select();

        const commit = async () => {
            const name = input.value.trim();
            if (!name) {
                draftContainer.remove();
                return;
            }
            const fullPath = folderPath + "/" + name;
            try {
                await Backend.createTemplate(fullPath, { mode: "request", subject: "", payload: "" });
                await app.loadTree();
                await app.selectTemplate(fullPath);
            } catch (e) {
                app.showToast("Failed: " + e); // This will show "Failed: template ... already exists"
                // Don't remove draft container so user can rename
            }
        };

        input.onkeydown = (e) => {
            if (e.key === 'Enter') input.blur();
            else if (e.key === 'Escape') draftContainer.remove();
        };
        input.onblur = commit;
    },

    newFolder: () => {
        console.log('newFolder triggered');
        const list = document.getElementById('template-list');

        const draftContainer = document.createElement('div');
        draftContainer.className = 'tree-node draft-node';

        const item = document.createElement('div');
        item.className = 'tree-item';
        item.style.paddingLeft = '8px';

        const icon = document.createElement('span');
        icon.className = 'tree-icon';
        icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h4l2 2h6v8H2V3z"/></svg>`;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tree-name-input';
        input.placeholder = 'New Folder';
        input.value = 'new_folder';
        input.style.flex = '1';

        item.appendChild(icon);
        item.appendChild(input);
        draftContainer.appendChild(item);

        list.appendChild(draftContainer);

        input.focus();
        input.select();

        const commit = async () => {
            const name = input.value.trim();
            if (!name) {
                draftContainer.remove();
                return;
            }

            try {
                console.log('Sending create folder request:', name);
                await Backend.createFolder(name);
                await app.loadTree();
            } catch (e) {
                app.showToast("Failed: " + e);
                draftContainer.remove();
            }
        };

        input.onkeydown = (e) => {
            if (e.key === 'Enter') input.blur();
            else if (e.key === 'Escape') draftContainer.remove();
        };
        input.onblur = commit;
    },

    createFolderFromDraft: async () => {
        if (!app.state.draftItem || !app.state.draftItem.path) {
            app.showToast('Please enter a folder name');
            return;
        }

        try {
            await Backend.createFolder(app.state.draftItem.path);

            app.state.expandedFolders.add(app.state.draftItem.path);
            app.state.draftItem = null;
            await app.loadTree();
        } catch (e) {
            console.error('Failed to create folder:', e);
            app.showToast('Failed to create folder');
        }
    },

    cancelDraft: () => {
        app.state.draftItem = null;
        app.renderTree();
    },

    saveTemplate: async () => {
        let path = app.state.currentPath || (app.state.draftItem ? app.state.draftItem.path : '');
        if (!path) {
            app.showToast('Please enter a template path');
            return;
        }

        const template = {
            mode: app.state.mode,
            subject: document.getElementById('subject-input').value,
            payload: document.getElementById('payload-input').value
        };

        try {
            await Backend.saveTemplate(path, template);

            app.state.draftItem = null; // Clear draft after save
            await app.loadTree();
            // Re-select the template
            app.selectTemplate(path);
        } catch (e) {
            console.error('Failed to save template:', e);
            app.showToast('Failed to save template');
        }
    },

    deleteTemplate: async () => {
        if (!app.state.currentPath) return;

        if (!await app.showConfirm(`Delete "${app.state.currentPath}"?`)) return;

        try {
            await Backend.deleteTemplate(app.state.currentPath);

            app.newTemplate();
            await app.loadTree();
        } catch (e) {
            console.error('Failed to delete template:', e);
            app.showToast('Failed to delete template');
        }
    },

    createFolder: async () => {
        const path = prompt('Enter folder path (e.g., Auth or Product/List):');
        if (!path) return;

        try {
            await Backend.createFolder(path);

            app.state.expandedFolders.add(path);
            await app.loadTree();
        } catch (e) {
            console.error('Failed to create folder:', e);
            app.showToast('Failed to create folder');
        }
    },

    // Variable Parsing
    parseVariables: async () => {
        const subject = document.getElementById('subject-input').value;
        const payload = document.getElementById('payload-input').value;
        const content = subject + '\n' + payload;

        try {
            const vars = await Backend.parseVariables(content);
            app.renderVariables(vars || []);
        } catch (e) {
            app.showToast('Failed to parse variables: ' + e);
        }
    },

    createVariableUI: (key, variable, options = {}) => {
        const { isGlobal = false, onRemove = null, onUpdate = null } = options;

        // Ensure variable object is valid
        const safeVar = {
            type: (variable && variable.type) || 'static',
            value: (variable && variable.value !== undefined) ? variable.value : (typeof variable === 'string' ? variable : '')
        };

        const item = document.createElement('div');
        item.className = 'global-var-item';

        // Header row
        const headerRow = document.createElement('div');
        headerRow.className = 'var-header-row';

        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.className = 'form-input key';
        keyInput.value = key;

        if (isGlobal) {
            keyInput.placeholder = 'Key';
            keyInput.oninput = (e) => {
                if (onUpdate) onUpdate({ ...safeVar, key: e.target.value });
            };
        } else {
            // Local variable keys are fixed (from template)
            keyInput.readOnly = true;
            keyInput.style.backgroundColor = 'transparent';
            keyInput.style.border = 'none';
            keyInput.style.fontWeight = 'bold';
            keyInput.style.paddingLeft = '0';
        }

        const typeSelect = document.createElement('select');
        typeSelect.className = 'form-select var-type';
        typeSelect.innerHTML = `
            <option value="static" ${safeVar.type === 'static' ? 'selected' : ''}>Static</option>
            <option value="dynamic" ${safeVar.type === 'dynamic' ? 'selected' : ''}>Dynamic (JS)</option>
        `;

        headerRow.appendChild(keyInput);
        headerRow.appendChild(typeSelect);

        if (onRemove) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn-remove';
            removeBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="3" x2="11" y2="11"/>
                    <line x1="11" y1="3" x2="3" y2="11"/>
                </svg>
            `;
            removeBtn.onclick = onRemove;
            headerRow.appendChild(removeBtn);
        }

        // Value row
        const valueRow = document.createElement('div');
        valueRow.className = 'var-value-row';

        let inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';

        const updateValue = (val) => {
            safeVar.value = val;
            if (onUpdate) onUpdate(safeVar);
        };

        const renderInput = (type) => {
            inputContainer.innerHTML = '';
            if (type === 'static') {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-input value';

                // Robust placeholder logic
                let placeholder = 'Value';
                if (!isGlobal) {
                    if (app.state.globalVars && app.state.globalVars[key]) {
                        const gVal = app.state.globalVars[key];
                        const gValStr = (typeof gVal === 'object') ? gVal.value : gVal;
                        placeholder = `Global: ${gValStr}`;
                    } else {
                        placeholder = `Enter value for ${key}...`;
                    }
                }
                input.placeholder = placeholder;

                input.value = safeVar.value;
                input.oninput = (e) => updateValue(e.target.value);
                inputContainer.appendChild(input);
            } else {
                const textarea = document.createElement('textarea');
                textarea.className = 'form-input value code-font';
                textarea.placeholder = 'e.g. timestamp() or uuid()';
                textarea.value = safeVar.value;
                textarea.rows = 2;
                textarea.oninput = (e) => updateValue(e.target.value);

                const snippetSelect = document.createElement('select');
                snippetSelect.className = 'snippet-select';
                snippetSelect.innerHTML = `
                    <option value="">Insert Snippet...</option>
                    <option value="timestamp()">Timestamp (Seconds)</option>
                    <option value="timestampMs()">Timestamp (MS)</option>
                    <option value="uuid()">UUID</option>
                    <option value="now()">ISO 8601 Date</option>
                    <option value="randomInt(1, 100)">Random Int</option>
                `;
                snippetSelect.onchange = (e) => {
                    if (e.target.value) {
                        textarea.value = e.target.value;
                        updateValue(e.target.value);
                        e.target.value = '';
                    }
                };

                const testBtn = document.createElement('button');
                testBtn.className = 'btn-secondary btn-sm';
                testBtn.textContent = 'Test';
                testBtn.onclick = async () => {
                    try {
                        const result = await Backend.evalDynamicScript(textarea.value);
                        app.showToast('Result: ' + result);
                    } catch (e) {
                        app.showToast('Error: ' + e.message);
                    }
                };

                const controlsRow = document.createElement('div');
                controlsRow.className = 'dynamic-controls';
                controlsRow.appendChild(snippetSelect);
                controlsRow.appendChild(testBtn);

                inputContainer.appendChild(textarea);
                inputContainer.appendChild(controlsRow);
            }
        };

        renderInput(safeVar.type);

        typeSelect.onchange = (e) => {
            safeVar.type = e.target.value;
            if (onUpdate) onUpdate(safeVar);
            renderInput(e.target.value);
        };

        valueRow.appendChild(inputContainer);

        item.appendChild(headerRow);
        item.appendChild(valueRow);
        return item;
    },

    renderVariables: (vars) => {
        try {
            const container = document.getElementById('variables-grid');
            const countEl = document.getElementById('variables-count');

            countEl.textContent = `${vars.length} variable${vars.length !== 1 ? 's' : ''}`;
            container.innerHTML = '';
            container.classList.remove('variables-grid');

            if (vars.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; padding: 12px; text-align: center; color: var(--text-muted); font-size: 11px;">
                        No variables detected. Use {{.variableName}} syntax.
                    </div>
                `;
                return;
            }

            vars.forEach(key => {
                let currentVar = app.state.localVars[key];
                if (!currentVar || typeof currentVar !== 'object') {
                    currentVar = { type: 'static', value: typeof currentVar === 'string' ? currentVar : '' };
                    app.state.localVars[key] = currentVar;
                }

                const item = app.createVariableUI(key, currentVar, {
                    isGlobal: false,
                    onUpdate: (updatedVar) => {
                        app.state.localVars[key] = updatedVar;
                    }
                });
                container.appendChild(item);
            });
        } catch (e) {
            console.error("Render variables error:", e);
        }
    },

    sendRequest: async () => {
        const subject = document.getElementById('subject-input').value;
        const body = document.getElementById('payload-input').value;
        const mode = app.state.mode;

        const statusEl = document.getElementById('response-status');
        const timeEl = document.getElementById('response-time');
        const outputEl = document.getElementById('response-output');
        const infoSubject = document.getElementById('info-subject');
        const infoSize = document.getElementById('info-size');

        statusEl.textContent = mode === 'jetstream' ? 'Publishing to JetStream...' : (mode === 'pubsub' ? 'Publishing...' : 'Sending...');
        statusEl.className = 'response-status';
        timeEl.textContent = '';
        outputEl.textContent = 'Waiting for response...';
        outputEl.className = 'response-code';

        try {
            let result;
            
            if (mode === 'jetstream') {
                // Use JetStream publish
                result = await Backend.jsPublish({
                    subject,
                    body,
                    variables: { ...app.state.globalVars, ...app.state.localVars },
                    config: {
                        url: document.getElementById('config-url').value,
                        creds_path: document.getElementById('config-creds').value
                    }
                });
                
                // Format JetStream response
                statusEl.textContent = `Status: ${result.status || 'published'}`;
                statusEl.className = 'response-status success';
                timeEl.textContent = '';
                
                const jsResponse = {
                    stream: result.stream,
                    sequence: result.sequence,
                    status: result.status
                };
                outputEl.textContent = JSON.stringify(jsResponse, null, 2);
                outputEl.className = 'response-code success';
                infoSubject.textContent = subject;
                infoSize.textContent = `Stream: ${result.stream}, Seq: ${result.sequence}`;
            } else {
                // Use regular request or pubsub
                result = await Backend.sendRequest({
                    mode,
                    subject,
                    body,
                    variables: { ...app.state.globalVars, ...app.state.localVars },
                    config: {
                        url: document.getElementById('config-url').value,
                        creds_path: document.getElementById('config-creds').value
                    }
                });

                statusEl.textContent = `Status: ${result.status || 'OK'}`;
                statusEl.className = 'response-status success';
                timeEl.textContent = result.elapsed || '';

                let responseText = result.reply || '';
                if (responseText && typeof responseText === 'string') {
                    try {
                        const obj = JSON.parse(responseText);
                        responseText = JSON.stringify(obj, null, 2);
                    } catch { }
                }

                outputEl.textContent = responseText;
                outputEl.className = 'response-code success';
                infoSubject.textContent = subject;
                infoSize.textContent = `${responseText.length} bytes`;
            }
        } catch (e) {
            console.error('Failed to send request:', e);
            statusEl.textContent = 'Error';
            statusEl.className = 'response-status error';
            outputEl.textContent = e.toString();
            outputEl.className = 'response-code error';
        }
    },

    // Pub/Sub Functions
    onModeChange: () => {
        const modeSelect = document.getElementById('mode-select');
        const mode = modeSelect.value;
        app.state.mode = mode;

        const sendBtn = document.getElementById('send-btn');
        const sendBtnText = document.getElementById('send-btn-text');
        
        if (mode === 'pubsub') {
            sendBtnText.textContent = 'Publish';
        } else if (mode === 'jetstream') {
            sendBtnText.textContent = 'JS Publish';
        } else {
            sendBtnText.textContent = 'Send Request';
        }
    },

    startSubscription: async () => {
        const subject = document.getElementById('subject-input').value;
        if (!subject.trim()) {
            app.showToast('Please enter a subject', 'error');
            return;
        }

        try {
            await Backend.subscribe({
                subject,
                config: {
                    url: document.getElementById('config-url').value,
                    creds_path: document.getElementById('config-creds').value
                }
            });
            app.showToast(`Subscribed to: ${subject}`, 'success');
            await app.loadActiveSubscriptions();
        } catch (e) {
            console.error('Failed to subscribe:', e);
            app.showToast(`Failed to subscribe: ${e.message}`, 'error');
        }
    },

    addNewSubscription: async () => {
        const input = document.getElementById('new-subscription-subject');
        const subject = input.value.trim();
        
        if (!subject) {
            app.showToast('Please enter a subject', 'error');
            return;
        }

        try {
            await Backend.subscribe({
                subject,
                config: {
                    url: document.getElementById('config-url').value,
                    creds_path: document.getElementById('config-creds').value
                }
            });
            app.showToast(`Subscribed to: ${subject}`, 'success');
            input.value = ''; // Clear input
            await app.loadActiveSubscriptions();
            app.renderSubscriptionsList();
        } catch (e) {
            console.error('Failed to subscribe:', e);
            app.showToast(`Failed to subscribe: ${e.message}`, 'error');
        }
    },

    loadActiveSubscriptions: async () => {
        try {
            app.state.activeSubscriptions = await Backend.getActiveSubscriptions();
        } catch (e) {
            console.error('Failed to load subscriptions:', e);
        }
    },

    openSubscriptions: async () => {
        await app.loadActiveSubscriptions();
        app.renderSubscriptionsList();
        
        // Start auto-refresh
        if (app.state.messageRefreshInterval) {
            clearInterval(app.state.messageRefreshInterval);
        }
        app.state.messageRefreshInterval = setInterval(() => {
            if (app.state.selectedSubscription) {
                app.refreshMessages();
            }
        }, 2000);

        document.getElementById('subscriptions-modal').classList.add('active');
    },

    closeSubscriptions: () => {
        if (app.state.messageRefreshInterval) {
            clearInterval(app.state.messageRefreshInterval);
            app.state.messageRefreshInterval = null;
        }
        document.getElementById('subscriptions-modal').classList.remove('active');
    },

    renderSubscriptionsList: () => {
        const listEl = document.getElementById('subscriptions-list');
        const countEl = document.getElementById('subscription-count');
        if (!listEl) return;

        // Update count
        if (countEl) {
            countEl.textContent = app.state.activeSubscriptions.length;
        }

        if (app.state.activeSubscriptions.length === 0) {
            listEl.innerHTML = '<p class="empty-state">No active subscriptions<br><small>Enter a subject above to subscribe</small></p>';
            return;
        }

        listEl.innerHTML = app.state.activeSubscriptions.map(subject => `
            <div class="subscription-item ${app.state.selectedSubscription === subject ? 'active' : ''}" 
                 data-subject="${subject}">
                <div class="subscription-subject">${subject}</div>
                <button class="btn-icon-sm unsubscribe-btn" data-subject="${subject}" title="Unsubscribe">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="3" x2="9" y2="9" />
                        <line x1="9" y1="3" x2="3" y2="9" />
                    </svg>
                </button>
            </div>
        `).join('');

        // Add click handlers
        listEl.querySelectorAll('.subscription-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.unsubscribe-btn')) return;
                app.selectSubscription(item.dataset.subject);
            });
        });

        listEl.querySelectorAll('.unsubscribe-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await app.unsubscribeFromSubject(btn.dataset.subject);
            });
        });
    },

    selectSubscription: async (subject) => {
        app.state.selectedSubscription = subject;
        app.renderSubscriptionsList();
        await app.loadMessages(subject);
    },

    unsubscribeFromSubject: async (subject) => {
        const confirmed = await app.showConfirm(`Unsubscribe from "${subject}"?`);
        if (!confirmed) return;

        try {
            await Backend.unsubscribe(subject);
            app.showToast(`Unsubscribed from: ${subject}`, 'success');
            
            if (app.state.selectedSubscription === subject) {
                app.state.selectedSubscription = null;
                document.getElementById('messages-list').innerHTML = 
                    '<p class="empty-state">Select a subscription to view messages</p>';
            }
            
            await app.loadActiveSubscriptions();
            app.renderSubscriptionsList();
        } catch (e) {
            console.error('Failed to unsubscribe:', e);
            app.showToast(`Failed to unsubscribe: ${e.message}`, 'error');
        }
    },

    loadMessages: async (subject) => {
        try {
            const messages = await Backend.getSubscriptionMessages(subject);
            app.state.subscriptionMessages[subject] = messages;
            app.renderMessages(subject);
        } catch (e) {
            console.error('Failed to load messages:', e);
            app.showToast(`Failed to load messages: ${e.message}`, 'error');
        }
    },

    renderMessages: (subject) => {
        const messagesEl = document.getElementById('messages-list');
        if (!messagesEl) return;

        const messages = app.state.subscriptionMessages[subject] || [];
        
        if (messages.length === 0) {
            messagesEl.innerHTML = '<p class="empty-state">No messages yet</p>';
            return;
        }

        messagesEl.innerHTML = messages.map((msg, idx) => `
            <div class="message-item">
                <div class="message-header">
                    <span class="message-index">#${idx + 1}</span>
                    <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="message-subject">${msg.subject}</div>
                <pre class="message-data">${msg.data}</pre>
            </div>
        `).join('');

        // Auto-scroll to bottom
        messagesEl.scrollTop = messagesEl.scrollHeight;
    },

    refreshMessages: async () => {
        if (!app.state.selectedSubscription) return;
        await app.loadMessages(app.state.selectedSubscription);
    },

    clearMessages: async () => {
        if (!app.state.selectedSubscription) return;

        const confirmed = await app.showConfirm('Clear all messages?');
        if (!confirmed) return;

        try {
            await Backend.clearSubscriptionMessages(app.state.selectedSubscription);
            app.showToast('Messages cleared', 'success');
            await app.loadMessages(app.state.selectedSubscription);
        } catch (e) {
            console.error('Failed to clear messages:', e);
            app.showToast(`Failed to clear messages: ${e.message}`, 'error');
        }
    },

    // JetStream Functions
    openJetStream: async () => {
        await app.loadJSStreams();
        document.getElementById('jetstream-modal').classList.add('active');
    },

    closeJetStream: () => {
        document.getElementById('jetstream-modal').classList.remove('active');
    },

    openStreamMessages: async (streamName) => {
        app.state.currentStreamName = streamName;
        app.state.currentPage = 1;
        app.state.currentStartSeq = 1;
        app.state.currentMessagesResult = null;
        document.getElementById('stream-messages-title').textContent = streamName;
        document.getElementById('stream-messages-modal').classList.add('active');
        await app.loadStreamMessages();
    },

    closeStreamMessages: () => {
        document.getElementById('stream-messages-modal').classList.remove('active');
        
        // Clear all cached data
        app.state.currentStreamName = null;
        app.state.currentPage = 1;
        app.state.currentStartSeq = 1;
        app.state.currentMessagesResult = null;
        app.state.cachedMessages = null;
        
        // Clear UI
        const messagesList = document.getElementById('stream-messages-list');
        if (messagesList) {
            messagesList.innerHTML = '\n                    <!-- Messages will be rendered here -->\n                ';
        }
        
        console.log('[CloseMessages] Cleared all cached data');
    },

    loadStreamMessages: async (refresh = false) => {
        if (!app.state.currentStreamName) return;
        
        // Prevent concurrent requests
        if (app.state.loadingMessages) {
            console.log('[LoadMessages] Already loading, skipping...');
            return;
        }
        
        console.log('[LoadMessages] Starting:', {
            streamName: app.state.currentStreamName,
            refresh
        });

        app.state.loadingMessages = true;
        
        // Show loading indicator
        const messagesList = document.getElementById('stream-messages-list');
        const prevBtn = document.querySelector('#pagination-controls .prev-page');
        const nextBtn = document.querySelector('#pagination-controls .next-page');
        const refreshBtn = document.getElementById('refresh-stream-messages-btn');
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (refreshBtn) refreshBtn.disabled = true;
        if (messagesList) {
            messagesList.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;"><div style="margin-bottom: 10px;">⏳</div>Loading messages...</div>';
        }
        
        try {
            console.log('[LoadMessages] Fetching all messages...');
            
            const result = await Backend.fetchAllStreamMessages(app.state.currentStreamName, refresh);
            
            console.log('[LoadMessages] Got result:', {
                total: result.total,
                count: result.messages?.length
            });
            
            app.state.allMessages = result.messages || [];
            app.state.currentPage = 1;
            
            const totalEl = document.getElementById('stream-total-messages');
            if (totalEl) totalEl.textContent = result.total || 0;
            app.renderMessagesPage();
        } catch (e) {
            console.error('[LoadMessages] ERROR:', e);
            app.showToast(`Failed to load messages: ${e.message}`, 'error');
            if (messagesList) {
                messagesList.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">Failed to load messages</div>';
            }
        } finally {
            console.log('[LoadMessages] Finally block');
            app.state.loadingMessages = false;
            if (refreshBtn) refreshBtn.disabled = false;
        }
    },

    renderMessagesPage: () => {
        const limit = parseInt(document.getElementById('messages-limit').value) || 10;
        const allMessages = app.state.allMessages || [];
        const currentPage = app.state.currentPage || 1;
        
        const startIdx = (currentPage - 1) * limit;
        const endIdx = startIdx + limit;
        const pageMessages = allMessages.slice(startIdx, endIdx);
        
        app.renderStreamMessages(pageMessages);
        
        // Update pagination controls
        const prevBtn = document.getElementById('prev-messages-btn');
        const nextBtn = document.getElementById('next-messages-btn');
        const totalPages = Math.ceil(allMessages.length / limit);
        
        if (prevBtn) {
            prevBtn.disabled = currentPage <= 1;
        }
        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages;
        }
        
        document.getElementById('messages-page-info').textContent = 
            `Page ${currentPage} of ${totalPages}`;
    },

    updatePaginationControls: (result) => {
        const paginationEl = document.getElementById('pagination-controls');
        if (!paginationEl) return;

        const prevBtn = paginationEl.querySelector('.prev-page');
        const nextBtn = paginationEl.querySelector('.next-page');
        const pageInfo = paginationEl.querySelector('.page-info');

        // Update buttons state
        if (prevBtn) prevBtn.disabled = app.state.currentStartSeq <= 1;
        if (nextBtn) nextBtn.disabled = !result.has_more;

        // Update page info
        if (pageInfo && result.messages && result.messages.length > 0) {
            pageInfo.textContent = `Seq ${result.start_seq} - ${result.end_seq}`;
        } else if (pageInfo) {
            pageInfo.textContent = 'No messages';
        }
    },

    nextPage: async () => {
        app.state.currentPage = (app.state.currentPage || 1) + 1;
        app.renderMessagesPage();
    },

    prevPage: async () => {
        app.state.currentPage = Math.max(1, (app.state.currentPage || 1) - 1);
        app.renderMessagesPage();
    },

    gotoPage: () => {
        const input = document.getElementById('goto-page-input');
        const pageNum = parseInt(input.value);
        
        if (isNaN(pageNum) || pageNum < 1) {
            app.showToast('Please enter a valid page number', 'error');
            return;
        }
        
        const limit = parseInt(document.getElementById('messages-limit').value) || 10;
        const allMessages = app.state.allMessages || [];
        const totalPages = Math.ceil(allMessages.length / limit);
        
        if (pageNum > totalPages) {
            app.showToast(`Page ${pageNum} doesn't exist. Max page: ${totalPages}`, 'error');
            return;
        }
        
        app.state.currentPage = pageNum;
        app.renderMessagesPage();
        input.value = ''; // Clear input after jump
    },

    renderStreamMessages: (messages) => {
        const listEl = document.getElementById('stream-messages-list');
        if (!listEl) return;

        console.log('[Render] Rendering messages:', {
            count: messages.length,
            sequences: messages.map(m => m.sequence),
            currentHTML: listEl.innerHTML.substring(0, 100)
        });

        // Fade out
        listEl.style.opacity = '0';
        
        setTimeout(() => {
            if (messages.length === 0) {
                listEl.innerHTML = '<p class="empty-state">No messages in stream</p>';
                listEl.style.opacity = '1';
                return;
            }

            listEl.innerHTML = messages.map(msg => `
            <div class="message-item">
                <div class="message-header">
                    <span class="message-seq">#${msg.sequence}</span>
                    <span class="message-subject">${msg.subject}</span>
                    <span class="message-time">${new Date(msg.time).toLocaleString()}</span>
                    <span class="message-size">${msg.size} bytes</span>
                </div>
                <div class="message-data">
                    <pre>${msg.data}</pre>
                </div>
            </div>
        `).join('');
        
            // Fade in
            listEl.style.opacity = '1';
        }, 150);
        
        console.log('[Render] After render, first message seq:', 
            listEl.querySelector('.message-seq')?.textContent);
    },

    switchJSTab: (tabName) => {
        document.querySelectorAll('.js-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.js-tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`.js-tab[data-tab="${tabName}"]`);
        const activePane = document.querySelector(`.js-tab-pane[data-pane="${tabName}"]`);
        
        if (activeTab) activeTab.classList.add('active');
        if (activePane) activePane.classList.add('active');
        
        if (tabName === 'consumers') {
            app.updateConsumerStreamSelect();
        } else if (tabName === 'kv') {
            app.loadKVBuckets();
        }
    },

    // KV Functions
    loadKVBuckets: async () => {
        const profile = app.state.currentProfile;
        if (!profile) {
            console.log('No profile selected, skipping bucket load');
            return;
        }
        
        try {
            app.state.kvBuckets = await Backend.listKVBuckets();
            app.renderKVBuckets();
        } catch (e) {
            console.error('Failed to load buckets:', e);
            app.showToast(`Failed to load buckets: ${e.message}`, 'error');
        }
    },

    renderKVBuckets: () => {
        const listEl = document.getElementById('kv-buckets-list');
        if (!listEl) return;

        if (app.state.kvBuckets.length === 0) {
            listEl.innerHTML = '<p class="empty-state">No KV buckets created yet</p>';
            return;
        }

        listEl.innerHTML = app.state.kvBuckets.map(bucket => `
            <div class="stream-item">
                <div class="stream-name">${bucket}</div>
                <button class="btn-icon-sm view-kv-btn" data-bucket="${bucket}" title="View Keys">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M1 6c1.5-3 4.5-3 5-3s3.5 0 5 3c-1.5 3-4.5 3-5 3s-3.5 0-5-3z"/>
                        <circle cx="6" cy="6" r="2"/>
                    </svg>
                </button>
            </div>
        `).join('');

        // Bind view buttons
        document.querySelectorAll('.view-kv-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const bucket = e.currentTarget.getAttribute('data-bucket');
                await app.viewKVKeys(bucket);
            });
        });
    },

    viewKVKeys: async (bucket) => {
        try {
            app.state.currentKVBucket = bucket;
            const keys = await Backend.listKVKeys(bucket);
            app.renderKVKeys(keys);
            document.getElementById('kv-viewer-modal').classList.add('active');
        } catch (e) {
            console.error('Failed to load keys:', e);
            app.showToast(`Failed to load keys: ${e.message}`, 'error');
        }
    },

    renderKVKeys: (keys) => {
        const listEl = document.getElementById('kv-keys-list');
        if (!listEl) return;

        document.getElementById('kv-bucket-name').textContent = app.state.currentKVBucket;

        if (keys.length === 0) {
            listEl.innerHTML = '<p class="empty-state">No keys in this bucket</p>';
            return;
        }

        listEl.innerHTML = keys.map(key => `
            <div class="kv-key-item">
                <div class="kv-key-name">${key}</div>
                <div style="display: flex; gap: 4px;">
                    <button class="btn-icon-sm get-kv-btn" data-key="${key}" title="Get Value">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M6 2v8M2 6h8"/>
                        </svg>
                    </button>
                    <button class="btn-icon-sm delete-kv-btn" data-key="${key}" title="Delete">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M2 3h8M4 3V2h4v1M5 5v4M7 5v4"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Bind buttons
        document.querySelectorAll('.get-kv-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const key = e.currentTarget.getAttribute('data-key');
                await app.getKVValue(key);
            });
        });

        document.querySelectorAll('.delete-kv-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const key = e.currentTarget.getAttribute('data-key');
                if (confirm(`Delete key "${key}"?`)) {
                    await app.deleteKVKey(key);
                }
            });
        });
    },

    getKVValue: async (key) => {
        try {
            const entry = await Backend.getKV(app.state.currentKVBucket, key);
            document.getElementById('kv-key-input').value = key;
            document.getElementById('kv-value-input').value = entry.value;
            document.getElementById('kv-revision').textContent = `Revision: ${entry.revision}`;
        } catch (e) {
            console.error('Failed to get value:', e);
            app.showToast(`Failed to get value: ${e.message}`, 'error');
        }
    },

    putKVValue: async () => {
        try {
            const key = document.getElementById('kv-key-input').value.trim();
            const value = document.getElementById('kv-value-input').value;
            
            if (!key) {
                app.showToast('Key is required', 'warning');
                return;
            }

            await Backend.putKV(app.state.currentKVBucket, key, value);
            app.showToast('Value saved successfully', 'success');
            
            // Reload keys
            const keys = await Backend.listKVKeys(app.state.currentKVBucket);
            app.renderKVKeys(keys);
            
            // Clear inputs
            document.getElementById('kv-key-input').value = '';
            document.getElementById('kv-value-input').value = '';
            document.getElementById('kv-revision').textContent = '';
        } catch (e) {
            console.error('Failed to put value:', e);
            app.showToast(`Failed to put value: ${e.message}`, 'error');
        }
    },

    deleteKVKey: async (key) => {
        try {
            await Backend.deleteKV(app.state.currentKVBucket, key);
            app.showToast('Key deleted successfully', 'success');
            
            // Reload keys
            const keys = await Backend.listKVKeys(app.state.currentKVBucket);
            app.renderKVKeys(keys);
            
            // Clear inputs if this key was being viewed
            if (document.getElementById('kv-key-input').value === key) {
                document.getElementById('kv-key-input').value = '';
                document.getElementById('kv-value-input').value = '';
                document.getElementById('kv-revision').textContent = '';
            }
        } catch (e) {
            console.error('Failed to delete key:', e);
            app.showToast(`Failed to delete key: ${e.message}`, 'error');
        }
    },

    closeKVViewer: () => {
        document.getElementById('kv-viewer-modal').classList.remove('active');
        app.state.currentKVBucket = null;
        document.getElementById('kv-key-input').value = '';
        document.getElementById('kv-value-input').value = '';
        document.getElementById('kv-revision').textContent = '';
    },

    loadJSStreams: async () => {
        try {
            app.state.jsStreams = await Backend.listJSStreams();
            app.renderJSStreams();
        } catch (e) {
            console.error('Failed to load streams:', e);
            app.showToast(`Failed to load streams: ${e.message}`, 'error');
        }
    },

    renderJSStreams: () => {
        const listEl = document.getElementById('streams-list');
        if (!listEl) return;

        if (app.state.jsStreams.length === 0) {
            listEl.innerHTML = '<p class="empty-state">No streams created yet</p>';
            return;
        }

        listEl.innerHTML = app.state.jsStreams.map(stream => `
            <div class="stream-item">
                <div class="stream-name">${stream}</div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-icon-sm view-messages-btn" data-stream="${stream}" title="View Messages">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M1 6c1.5-3 4.5-3 5-3s3.5 0 5 3c-1.5 3-4.5 3-5 3s-3.5 0-5-3z"/>
                            <circle cx="6" cy="6" r="2"/>
                        </svg>
                    </button>
                    <button class="btn-icon-sm delete-stream-btn" data-stream="${stream}" title="Delete">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="3" x2="9" y2="9" />
                            <line x1="9" y1="3" x2="3" y2="9" />
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        listEl.querySelectorAll('.view-messages-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                app.openStreamMessages(btn.dataset.stream);
            });
        });

        listEl.querySelectorAll('.delete-stream-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await app.deleteJSStream(btn.dataset.stream);
            });
        });
    },

    createJSStream: async () => {
        const name = document.getElementById('stream-name').value.trim();
        const subjectsStr = document.getElementById('stream-subjects').value.trim();
        const storage = document.getElementById('stream-storage').value;

        if (!name) {
            app.showToast('Please enter stream name', 'error');
            return;
        }
        if (!subjectsStr) {
            app.showToast('Please enter subjects', 'error');
            return;
        }

        const subjects = subjectsStr.split(',').map(s => s.trim()).filter(s => s);

        try {
            await Backend.createJSStream({
                name,
                subjects,
                storage,
                replicas: 1,
                config: {}
            });
            
            app.showToast(`Stream "${name}" created`, 'success');
            
            // Clear inputs
            document.getElementById('stream-name').value = '';
            document.getElementById('stream-subjects').value = '';
            
            await app.loadJSStreams();
        } catch (e) {
            console.error('Failed to create stream:', e);
            app.showToast(`Failed to create stream: ${e.message}`, 'error');
        }
    },

    deleteJSStream: async (name) => {
        const confirmed = await app.showConfirm(`Delete stream "${name}"?`);
        if (!confirmed) return;

        try {
            await Backend.deleteJSStream(name);
            app.showToast(`Stream "${name}" deleted`, 'success');
            await app.loadJSStreams();
        } catch (e) {
            console.error('Failed to delete stream:', e);
            app.showToast(`Failed to delete stream: ${e.message}`, 'error');
        }
    },

    updateConsumerStreamSelect: async () => {
        const select = document.getElementById('consumer-stream');
        if (!select) return;

        await app.loadJSStreams();

        select.innerHTML = '<option value="">Select a stream...</option>';
        app.state.jsStreams.forEach(stream => {
            const option = document.createElement('option');
            option.value = stream;
            option.textContent = stream;
            select.appendChild(option);
        });
    },

    createJSConsumer: async () => {
        const streamName = document.getElementById('consumer-stream').value;
        const name = document.getElementById('consumer-name').value.trim();
        const deliverPolicy = document.getElementById('consumer-deliver-policy').value;
        const ackPolicy = document.getElementById('consumer-ack-policy').value;

        if (!streamName) {
            app.showToast('Please select a stream', 'error');
            return;
        }
        if (!name) {
            app.showToast('Please enter consumer name', 'error');
            return;
        }

        try {
            await Backend.createJSConsumer({
                stream_name: streamName,
                name,
                deliver_policy: deliverPolicy,
                ack_policy: ackPolicy,
                config: {}
            });
            
            app.showToast(`Consumer "${name}" created`, 'success');
            
            // Clear input
            document.getElementById('consumer-name').value = '';
        } catch (e) {
            console.error('Failed to create consumer:', e);
            app.showToast(`Failed to create consumer: ${e.message}`, 'error');
        }
    },

    openSettings: () => {
        app.renderNatsProfileSelector();
        document.getElementById('settings-modal').classList.add('active');
    },

    closeSettings: () => {
        document.getElementById('settings-modal').classList.remove('active');
    },

    saveSettings: async () => {
        console.log('[saveSettings] Function called');
        const profileName = app.state.activeNatsProfile;
        const profile = {
            name: profileName,
            url: document.getElementById('config-url').value,
            creds_path: document.getElementById('config-creds').value
        };
        console.log('[saveSettings] Profile:', profile);

        try {
            await Backend.saveNatsProfile(profile);

            await app.loadNatsProfiles();
            app.closeSettings();
            console.log('[saveSettings] Save completed');
        } catch (e) {
            console.error('Failed to save NATS profile:', e);
            app.showToast('Failed to save profile');
        }
    },

    openGlobals: () => {
        try {
            app.renderGlobalsProfileSelector();
            app.renderGlobalsList();
            document.getElementById('globals-modal').classList.add('active');
        } catch (e) {
            console.error(e);
            app.showToast("Error opening globals");
        }
    },

    closeGlobals: () => {
        document.getElementById('globals-modal').classList.remove('active');
    },

    renderGlobalsList: () => {
        try {
            const container = document.getElementById('globals-list');
            container.innerHTML = '';
            Object.entries(app.state.globalVars).forEach(([key, variable]) => {
                const item = app.createVariableUI(key, variable, {
                    isGlobal: true,
                    onRemove: (e) => e.target.closest('.global-var-item').remove()
                });
                container.appendChild(item);
            });
        } catch (e) { console.error(e); }
    },

    addGlobalVar: () => {
        const container = document.getElementById('globals-list');
        const item = app.createVariableUI('', { type: 'static', value: '' }, {
            isGlobal: true,
            onRemove: (e) => e.target.closest('.global-var-item').remove()
        });
        container.appendChild(item);
    },

    saveGlobals: async () => {
        console.log('[saveGlobals] Function called');
        const container = document.getElementById('globals-list');
        const vars = {};

        container.querySelectorAll('.global-var-item').forEach(item => {
            const keyInput = item.querySelector('.key');
            if (!keyInput) return;
            const key = keyInput.value.trim();
            const typeSelect = item.querySelector('.var-type');
            const valueInput = item.querySelector('.value');

            if (key && typeSelect && valueInput) {
                vars[key] = {
                    type: typeSelect.value,
                    value: valueInput.value
                };
            }
        });

        const profileName = app.state.activeGlobalsProfile;
        const profile = {
            name: profileName,
            variables: vars
        };
        console.log('[saveGlobals] Profile:', profile);

        try {
            await Backend.saveGlobalsProfile(profile);

            app.state.globalVars = vars;
            await app.loadGlobalsProfiles();
            app.closeGlobals();
            app.parseVariables(); // Re-render local vars to update placeholders
            console.log('[saveGlobals] Save completed');
        } catch (e) {
            console.error('Failed to save globals profile:', e);
            app.showToast('Failed to save profile');
        }
    },

    // JS Extensions Management
    openExtensions: async () => {
        document.getElementById('extensions-modal').classList.add('active');
        await app.loadExtensions();
    },

    closeExtensions: () => {
        document.getElementById('extensions-modal').classList.remove('active');
    },

    loadExtensions: async () => {
        try {
            const data = await Backend.getJSExtensions();
            app.state.availableExtensions = data.available || [];
            app.state.activeExtensions = data.active || [];
            app.renderExtensions();
        } catch (e) {
            console.error('Failed to load extensions:', e);
            app.showToast('Failed to load extensions');
        }
    },

    renderExtensions: () => {
        const container = document.getElementById('extensions-list');
        container.innerHTML = '';

        if (app.state.availableExtensions.length === 0) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;">
                    No JavaScript extensions found. Place .js files in the extensions directory.
                </div>
            `;
            return;
        }

        app.state.availableExtensions.forEach(filename => {
            const isActive = app.state.activeExtensions.includes(filename);
            const item = document.createElement('label');
            item.className = 'extension-item';
            item.style.cssText = 'display: flex; align-items: center; padding: 10px; background: var(--bg-secondary); border-radius: 4px; cursor: pointer;';
            
            item.innerHTML = `
                <input type="checkbox" ${isActive ? 'checked' : ''} data-filename="${filename}" 
                    style="margin-right: 10px; cursor: pointer;">
                <span style="font-family: var(--font-mono); font-size: 12px;">${filename}</span>
            `;
            
            container.appendChild(item);
        });
    },

    saveExtensions: async () => {
        console.log('[saveExtensions] Function called');
        const checkboxes = document.querySelectorAll('#extensions-list input[type="checkbox"]');
        const activeExtensions = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.filename);
        console.log('[saveExtensions] Active extensions:', activeExtensions);

        try {
            await Backend.setActiveJSExtensions(activeExtensions);
            app.state.activeExtensions = activeExtensions;
            app.closeExtensions();
            app.showToast('Extensions saved');
            console.log('[saveExtensions] Save completed');
        } catch (e) {
            console.error('Failed to save extensions:', e);
            app.showToast('Failed to save extensions');
        }
    },

    renderNatsProfileSelector: () => {
        const select = document.getElementById('nats-profile-select');
        select.innerHTML = '';

        app.state.natsProfiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.name;
            option.textContent = profile.name;
            option.selected = profile.name === app.state.activeNatsProfile;
            select.appendChild(option);
        });
    },

    renderGlobalsProfileSelector: () => {
        const select = document.getElementById('globals-profile-select');
        select.innerHTML = '';

        app.state.globalsProfiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.name;
            option.textContent = profile.name;
            option.selected = profile.name === app.state.activeGlobalsProfile;
            select.appendChild(option);
        });
    },

    // UI Interactions
    toggleSidebar: () => {
        const sidebar = document.getElementById('sidebar');
        const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');

        if (isCurrentlyCollapsed) {
            // Expanding - restore previous width
            sidebar.classList.remove('collapsed');
            sidebar.style.width = `${app.state.sidebarWidth}px`;
            app.state.sidebarCollapsed = false;
        } else {
            // Collapsing - remove inline width to let CSS take over
            sidebar.classList.add('collapsed');
            sidebar.style.width = '';
            app.state.sidebarCollapsed = true;
        }
    },

    switchResponseTab: (tabName) => {
        document.querySelectorAll('.response-tabs .tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        document.querySelectorAll('.response-body .tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.content === tabName);
        });
    },

    switchRequestTab: (tabName) => {
        document.querySelectorAll('.request-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.dataset.pane === tabName);
        });
    },

    // Resize Handles
    initResizeHandles: () => {
        // Response panel resize
        const responseHandle = document.getElementById('resize-handle');
        const responsePanel = document.getElementById('response-panel');
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;

        responseHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = responsePanel.offsetHeight;
            responseHandle.classList.add('dragging');
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const delta = startY - e.clientY;
            const newHeight = Math.max(200, Math.min(window.innerHeight - 200, startHeight + delta));
            responsePanel.style.height = `${newHeight}px`;
            app.state.responseHeight = newHeight;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                responseHandle.classList.remove('dragging');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });

        // Sidebar resize
        const sidebarHandle = document.getElementById('sidebar-resize-handle');
        const sidebar = document.getElementById('sidebar');
        let isSidebarResizing = false;
        let startX = 0;
        let startWidth = 0;

        sidebarHandle.addEventListener('mousedown', (e) => {
            // Don't allow resize when collapsed
            if (sidebar.classList.contains('collapsed')) return;

            isSidebarResizing = true;
            startX = e.clientX;
            startWidth = sidebar.offsetWidth;
            sidebar.classList.add('resizing');
            sidebarHandle.classList.add('dragging');
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isSidebarResizing) return;

            const delta = e.clientX - startX;
            const newWidth = Math.max(200, Math.min(500, startWidth + delta));
            sidebar.style.width = `${newWidth}px`;
            app.state.sidebarWidth = newWidth;
        });

        document.addEventListener('mouseup', () => {
            if (isSidebarResizing) {
                isSidebarResizing = false;
                sidebar.classList.remove('resizing');
                sidebarHandle.classList.remove('dragging');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    },

    // Event Listeners
    setupEventListeners: () => {
        console.log('[SetupEvents] Entering setupEventListeners...');
        try {
            // Sidebar
            const sidebarToggle = document.getElementById('sidebar-toggle');
            console.log('[SetupEvents] sidebarToggle:', sidebarToggle);
            if (sidebarToggle) sidebarToggle.onclick = app.toggleSidebar;

            const addFolderBtn = document.getElementById('add-folder-btn');
            console.log('[SetupEvents] addFolderBtn:', addFolderBtn);
            if (addFolderBtn) addFolderBtn.onclick = app.newFolder;

            // Search
            const searchInput = document.getElementById('template-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    app.state.searchQuery = e.target.value.trim();
                    app.renderTree();
                });
            }

            // Template Actions
            const saveBtn = document.getElementById('save-btn');
            console.log('[SetupEvents] saveBtn:', saveBtn);
            if (saveBtn) saveBtn.onclick = app.saveTemplate;

            const deleteBtn = document.getElementById('delete-btn');
            if (deleteBtn) deleteBtn.onclick = app.deleteTemplate;

            console.log('[SetupEvents] Input listeners...');
            // Input Changes
            const subjectInput = document.getElementById('subject-input');
            const payloadInput = document.getElementById('payload-input');

            let parseTimeout;
            const debouncedParse = () => {
                clearTimeout(parseTimeout);
                parseTimeout = setTimeout(app.parseVariables, 300);
            };

            if (subjectInput) subjectInput.addEventListener('input', debouncedParse);
            if (payloadInput) payloadInput.addEventListener('input', debouncedParse);

            // Send Request
            const sendBtn = document.getElementById('send-btn');
            console.log('[SetupEvents] sendBtn:', sendBtn);
            if (sendBtn) sendBtn.onclick = app.sendRequest;

            console.log('[SetupEvents] Tab listeners...');
            // Request Tabs
            document.querySelectorAll('.request-tab').forEach(tab => {
                tab.onclick = () => app.switchRequestTab(tab.dataset.tab);
            });

            // Response Tabs
            document.querySelectorAll('.response-tabs .tab').forEach(tab => {
                tab.onclick = () => app.switchResponseTab(tab.dataset.tab);
            });

            console.log('[SetupEvents] Modal listeners...');
            // Settings Modal
            const settingsBtn = document.getElementById('settings-btn');
            const settingsClose = document.getElementById('settings-close');
            const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
            const saveSettingsBtn = document.getElementById('save-settings-btn');
            console.log('[SetupEvents] Settings buttons:', {settingsBtn, settingsClose, cancelSettingsBtn, saveSettingsBtn});
            
            if (settingsBtn) settingsBtn.onclick = app.openSettings;
            if (settingsClose) settingsClose.onclick = app.closeSettings;
            if (cancelSettingsBtn) cancelSettingsBtn.onclick = app.closeSettings;
            if (saveSettingsBtn) {
                console.log('[SetupEvents] Binding save-settings-btn to:', app.saveSettings);
                saveSettingsBtn.onclick = app.saveSettings;
            }
            const settingsBackdrop = document.querySelector('#settings-modal .modal-backdrop');
            if (settingsBackdrop) settingsBackdrop.onclick = app.closeSettings;

            // Globals Modal
            const globalsBtn = document.getElementById('globals-btn');
            const globalsClose = document.querySelector('#globals-close');
            const cancelGlobalsBtn = document.getElementById('cancel-globals-btn');
            const addGlobalBtn = document.getElementById('add-global-btn');
            const saveGlobalsBtn = document.getElementById('save-globals-btn');
            console.log('[SetupEvents] Globals buttons:', {globalsBtn, globalsClose, cancelGlobalsBtn, addGlobalBtn, saveGlobalsBtn});
            
            if (globalsBtn) globalsBtn.onclick = app.openGlobals;
            if (globalsClose) globalsClose.onclick = app.closeGlobals;
            if (cancelGlobalsBtn) cancelGlobalsBtn.onclick = app.closeGlobals;
            if (addGlobalBtn) addGlobalBtn.onclick = app.addGlobalVar;
            if (saveGlobalsBtn) {
                console.log('[SetupEvents] Binding save-globals-btn to:', app.saveGlobals);
                saveGlobalsBtn.onclick = app.saveGlobals;
            }
            const globalsBackdrop = document.querySelector('#globals-modal .modal-backdrop');
            if (globalsBackdrop) globalsBackdrop.onclick = app.closeGlobals;

            // Extensions Modal
            const extensionsBtn = document.getElementById('extensions-btn');
            const extensionsClose = document.querySelector('#extensions-close');
            const cancelExtensionsBtn = document.getElementById('cancel-extensions-btn');
            const saveExtensionsBtn = document.getElementById('save-extensions-btn');
            console.log('[SetupEvents] Extensions buttons:', {extensionsBtn, extensionsClose, cancelExtensionsBtn, saveExtensionsBtn});
            
            if (extensionsBtn) extensionsBtn.onclick = app.openExtensions;
            if (extensionsClose) extensionsClose.onclick = app.closeExtensions;
            if (cancelExtensionsBtn) cancelExtensionsBtn.onclick = app.closeExtensions;
            if (saveExtensionsBtn) {
                console.log('[SetupEvents] Binding save-extensions-btn to:', app.saveExtensions);
                saveExtensionsBtn.onclick = app.saveExtensions;
            }
            const extensionsBackdrop = document.querySelector('#extensions-modal .modal-backdrop');
            if (extensionsBackdrop) extensionsBackdrop.onclick = app.closeExtensions;

            // Mode Selection
            const modeSelect = document.getElementById('mode-select');
            if (modeSelect) {
                modeSelect.addEventListener('change', app.onModeChange);
            }

            // Subscribe Button
            const subscribeBtn = document.getElementById('subscribe-btn');
            if (subscribeBtn) subscribeBtn.onclick = app.startSubscription;

            // Subscriptions Modal
            document.getElementById('subscriptions-btn').onclick = app.openSubscriptions;
            document.getElementById('subscriptions-close').onclick = app.closeSubscriptions;
            document.getElementById('close-subscriptions-btn').onclick = app.closeSubscriptions;
            document.querySelector('#subscriptions-modal .modal-backdrop').onclick = app.closeSubscriptions;
            
            // Add subscription button
            const addSubscriptionBtn = document.getElementById('add-subscription-btn');
            if (addSubscriptionBtn) addSubscriptionBtn.onclick = app.addNewSubscription;
            
            // New subscription input - Enter key
            const newSubInput = document.getElementById('new-subscription-subject');
            if (newSubInput) {
                newSubInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        app.addNewSubscription();
                    }
                });
            }
            
            const refreshBtn = document.getElementById('refresh-messages-btn');
            if (refreshBtn) refreshBtn.onclick = app.refreshMessages;
            
            const clearBtn = document.getElementById('clear-messages-btn');
            if (clearBtn) clearBtn.onclick = app.clearMessages;

            // JetStream Modal
            document.getElementById('jetstream-btn').onclick = app.openJetStream;
            document.getElementById('jetstream-close').onclick = app.closeJetStream;
            document.getElementById('close-jetstream-btn').onclick = app.closeJetStream;
            document.querySelector('#jetstream-modal .modal-backdrop').onclick = app.closeJetStream;

            // JetStream tabs
            document.querySelectorAll('.js-tab').forEach(tab => {
                tab.onclick = () => app.switchJSTab(tab.dataset.tab);
            });

            // JetStream actions
            const createStreamBtn = document.getElementById('create-stream-btn');
            if (createStreamBtn) createStreamBtn.onclick = app.createJSStream;

            const refreshStreamsBtn = document.getElementById('refresh-streams-btn');
            if (refreshStreamsBtn) refreshStreamsBtn.onclick = app.loadJSStreams;

            const createConsumerBtn = document.getElementById('create-consumer-btn');
            if (createConsumerBtn) createConsumerBtn.onclick = app.createJSConsumer;

            // Stream Messages Modal
            document.getElementById('stream-messages-close').onclick = app.closeStreamMessages;
            document.getElementById('close-stream-messages-btn').onclick = app.closeStreamMessages;
            document.querySelector('#stream-messages-modal .modal-backdrop').onclick = app.closeStreamMessages;
            
            const refreshMessagesBtn = document.getElementById('refresh-stream-messages-btn');
            if (refreshMessagesBtn) refreshMessagesBtn.onclick = () => app.loadStreamMessages(true);

            // Pagination controls
            const prevPageBtn = document.getElementById('prev-messages-btn');
            const nextPageBtn = document.getElementById('next-messages-btn');
            const gotoPageBtn = document.getElementById('goto-page-btn');
            const gotoPageInput = document.getElementById('goto-page-input');
            
            if (prevPageBtn) prevPageBtn.onclick = app.prevPage;
            if (nextPageBtn) nextPageBtn.onclick = app.nextPage;
            if (gotoPageBtn) gotoPageBtn.onclick = app.gotoPage;
            if (gotoPageInput) {
                gotoPageInput.onkeypress = (e) => {
                    if (e.key === 'Enter') app.gotoPage();
                };
            }

            // KV Viewer Modal
            const closeKVBtn = document.getElementById('close-kv-viewer-btn');
            if (closeKVBtn) closeKVBtn.onclick = app.closeKVViewer;
            
            const kvBackdrop = document.querySelector('#kv-viewer-modal .modal-backdrop');
            if (kvBackdrop) kvBackdrop.onclick = app.closeKVViewer;
            
            const putKVBtn = document.getElementById('put-kv-btn');
            if (putKVBtn) putKVBtn.onclick = app.putKVValue;

            console.log('[SetupEvents] Finished setupEventListeners');
        } catch (e) {
            console.error('[SetupEvents] Error:', e);
            app.showToast('SetupEvents Error: ' + e.message);
        }

        // Profile Management
        // NATS Profiles
        document.getElementById('nats-profile-select').onchange = async (e) => {
            await app.switchNatsProfile(e.target.value);
            await app.loadConfig();
        };

        document.getElementById('new-nats-profile-btn').onclick = async () => {
            const name = prompt('Enter new NATS profile name:');
            if (!name) return;

            const profile = {
                name,
                url: document.getElementById('config-url').value || 'nats://localhost:4222',
                creds_path: document.getElementById('config-creds').value || ''
            };

            try {
                await Backend.saveNatsProfile(profile);
                await app.loadNatsProfiles();
                await app.switchNatsProfile(name);
                app.renderNatsProfileSelector();
            } catch (e) {
                app.showToast('Failed to create profile');
            }
        };

        document.getElementById('delete-nats-profile-btn').onclick = async () => {
            const name = app.state.activeNatsProfile;
            if (!await app.showConfirm(`Delete profile "${name}"?`)) return;

            try {
                await Backend.deleteNatsProfile(name);
                await app.loadNatsProfiles();
                await app.loadConfig();
                app.renderNatsProfileSelector();
            } catch (e) {
                app.showToast(e.message || 'Failed to delete profile');
            }
        };

        // Globals Profiles
        document.getElementById('globals-profile-select').onchange = async (e) => {
            await app.switchGlobalsProfile(e.target.value);
            app.renderGlobalsList();
        };

        document.getElementById('new-globals-profile-btn').onclick = async () => {
            const name = prompt('Enter new globals profile name:');
            if (!name) return;

            const container = document.getElementById('globals-list');
            const vars = {};
            container.querySelectorAll('.global-var-item').forEach(item => {
                const keyInput = item.querySelector('.key');
                if (!keyInput) return;
                const key = keyInput.value.trim();

                const typeSelect = item.querySelector('.var-type');
                const valueInput = item.querySelector('.value');

                if (key) {
                    vars[key] = {
                        type: typeSelect ? typeSelect.value : 'static',
                        value: valueInput ? valueInput.value : ''
                    };
                }
            });

            const profile = { name, variables: vars };

            try {
                await Backend.saveGlobalsProfile(profile);
                await app.loadGlobalsProfiles();
                await app.switchGlobalsProfile(name);
                app.renderGlobalsProfileSelector();
            } catch (e) {
                app.showToast('Failed to create profile');
            }
        };

        document.getElementById('delete-globals-profile-btn').onclick = async () => {
            const name = app.state.activeGlobalsProfile;
            if (!await app.showConfirm(`Delete profile "${name}"?`)) return;

            try {
                await Backend.deleteGlobalsProfile(name);
                await app.loadGlobalsProfiles();
                await app.loadGlobals();
                app.renderGlobalsProfileSelector();
                app.renderGlobalsList();
            } catch (e) {
                app.showToast(e.message || 'Failed to delete profile');
            }
        };

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter to send
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                app.sendRequest();
            }
            // Ctrl+S to save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                app.saveTemplate();
            }
        });
    }
};

// === Key-Value Store Management ===
const kvManager = {
    currentBucket: null,
    buckets: [],
    keys: [],

    async init() {
        await this.loadBuckets();
        this.setupEventListeners();
    },

    setupEventListeners() {
        const kvBtn = document.getElementById('kv-btn');
        const kvModal = document.getElementById('kv-modal');
        const kvClose = document.getElementById('kv-close');
        const createBucketBtn = document.getElementById('create-bucket-btn');
        const addKeyBtn = document.getElementById('add-kv-key-btn');
        const refreshBtn = document.getElementById('refresh-kv-btn');
        const deleteBucketBtn = document.getElementById('delete-bucket-btn');

        if (kvBtn) {
            kvBtn.addEventListener('click', async () => {
                kvModal.classList.add('active');
                await this.loadBuckets();
            });
        }

        if (kvClose) {
            kvClose.addEventListener('click', () => {
                kvModal.classList.remove('active');
            });
        }

        if (createBucketBtn) {
            createBucketBtn.addEventListener('click', () => this.showCreateBucketDialog());
        }

        if (addKeyBtn) {
            addKeyBtn.addEventListener('click', () => this.showAddKeyDialog());
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                if (this.currentBucket) {
                    await this.loadKeys(this.currentBucket);
                }
            });
        }

        if (deleteBucketBtn) {
            deleteBucketBtn.addEventListener('click', () => this.deleteBucket());
        }
    },

    async loadBuckets() {
        try {
            const profile = app.state.activeNatsProfile;
            if (!profile) {
                throw new Error('No profile selected');
            }
            const response = await fetch(`/api/kv/buckets?profile=${encodeURIComponent(profile)}`);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Server error: ${response.status} - ${text}`);
            }
            const data = await response.json();
            this.buckets = data.buckets || [];
            this.renderBuckets();
        } catch (error) {
            console.error('Failed to load buckets:', error);
            alert('Failed to load buckets: ' + error.message);
        }
    },

    renderBuckets() {
        const list = document.getElementById('kv-bucket-list');
        if (!list) return;

        if (this.buckets.length === 0) {
            list.innerHTML = '<div style="padding: 12px; color: var(--text-muted); font-size: 12px;">No buckets found</div>';
            return;
        }

        list.innerHTML = this.buckets.map(bucket => `
            <div class="kv-bucket-item ${bucket === this.currentBucket ? 'active' : ''}" data-bucket="${bucket}">
                <span class="kv-bucket-name">${bucket}</span>
            </div>
        `).join('');

        // Add click handlers
        list.querySelectorAll('.kv-bucket-item').forEach(item => {
            item.addEventListener('click', () => {
                const bucket = item.dataset.bucket;
                this.selectBucket(bucket);
            });
        });
    },

    async selectBucket(bucket) {
        this.currentBucket = bucket;
        this.renderBuckets();
        
        document.getElementById('kv-bucket-name').textContent = bucket;
        document.getElementById('refresh-kv-btn').style.display = 'flex';
        document.getElementById('add-kv-key-btn').style.display = 'block';
        document.getElementById('delete-bucket-btn').style.display = 'block';
        document.getElementById('kv-empty-state').style.display = 'none';
        document.getElementById('kv-keys-container').style.display = 'block';

        await this.loadKeys(bucket);
    },

    async loadKeys(bucket) {
        try {
            const profile = app.state.activeNatsProfile;
            if (!profile) {
                throw new Error('No profile selected');
            }
            const response = await fetch(`/api/kv/buckets/${bucket}/keys?profile=${encodeURIComponent(profile)}`);
            const data = await response.json();
            this.keys = data.keys || [];
            this.renderKeys();
        } catch (error) {
            console.error('Failed to load keys:', error);
            alert('Failed to load keys: ' + error.message);
        }
    },

    renderKeys() {
        const list = document.getElementById('kv-keys-list');
        if (!list) return;

        if (this.keys.length === 0) {
            list.innerHTML = '<div style="padding: 12px; color: var(--text-muted); font-size: 12px;">No keys in this bucket</div>';
            return;
        }

        list.innerHTML = this.keys.map(key => `
            <div class="kv-key-item" data-key="${key}">
                <div class="kv-key-header">
                    <span class="kv-key-name">${key}</span>
                    <div class="kv-key-actions">
                        <button class="btn-icon-sm" onclick="kvManager.viewKey('${key}')" title="View">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" />
                                <circle cx="6" cy="6" r="1.5" />
                            </svg>
                        </button>
                        <button class="btn-icon-sm" onclick="kvManager.editKey('${key}')" title="Edit">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M8 1l3 3L4 11H1v-3L8 1z" />
                            </svg>
                        </button>
                        <button class="btn-icon-sm" onclick="kvManager.deleteKey('${key}')" title="Delete">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M1 3h10M4 3V2a1 1 0 011-1h2a1 1 0 011 1v1M10 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="kv-key-body" id="kv-key-${key}"></div>
            </div>
        `).join('');
    },

    async viewKey(key) {
        try {
            const profile = app.state.activeNatsProfile;
            const response = await fetch(`/api/kv/buckets/${this.currentBucket}/keys/${key}?profile=${encodeURIComponent(profile)}`);
            const data = await response.json();
            
            const keyBody = document.getElementById(`kv-key-${key}`);
            if (keyBody.classList.contains('expanded')) {
                keyBody.classList.remove('expanded');
                return;
            }

            keyBody.innerHTML = `
                <div class="kv-key-value">${data.entry.value}</div>
                <div class="kv-key-meta" style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">
                    Revision: ${data.entry.revision} | Created: ${new Date(data.entry.created).toLocaleString()}
                </div>
            `;
            keyBody.classList.add('expanded');
        } catch (error) {
            console.error('Failed to get key:', error);
            alert('Failed to get key: ' + error.message);
        }
    },

    async editKey(key) {
        try {
            const profile = app.state.activeNatsProfile;
            const response = await fetch(`/api/kv/buckets/${this.currentBucket}/keys/${key}?profile=${encodeURIComponent(profile)}`);
            const data = await response.json();
            
            const newValue = prompt(`Edit value for key "${key}":`, data.entry.value);
            if (newValue !== null) {
                await this.putKey(key, newValue);
            }
        } catch (error) {
            console.error('Failed to edit key:', error);
            alert('Failed to edit key: ' + error.message);
        }
    },

    async deleteKey(key) {
        if (!confirm(`Delete key "${key}"?`)) return;

        try {
            const profile = app.state.activeNatsProfile;
            const response = await fetch(`/api/kv/buckets/${this.currentBucket}/keys/${key}?profile=${encodeURIComponent(profile)}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Delete failed');
            
            await this.loadKeys(this.currentBucket);
        } catch (error) {
            console.error('Failed to delete key:', error);
            alert('Failed to delete key: ' + error.message);
        }
    },

    async putKey(key, value) {
        try {
            const profile = app.state.activeNatsProfile;
            const response = await fetch(`/api/kv/buckets/${this.currentBucket}/keys/${key}?profile=${encodeURIComponent(profile)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value })
            });
            
            if (!response.ok) throw new Error('Put failed');
            
            await this.loadKeys(this.currentBucket);
        } catch (error) {
            console.error('Failed to put key:', error);
            alert('Failed to put key: ' + error.message);
        }
    },

    showCreateBucketDialog() {
        const bucketName = prompt('Enter bucket name:');
        if (!bucketName) return;

        const historyStr = prompt('Max history per key (default: 1):', '1');
        const maxHistory = parseInt(historyStr) || 1;

        this.createBucket(bucketName, maxHistory);
    },

    async createBucket(bucketName, maxHistoryPerKey) {
        try {
            const profile = app.state.activeNatsProfile;
            const response = await fetch('/api/kv/buckets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    profile: profile,
                    bucket_name: bucketName, 
                    max_history_per_key: maxHistoryPerKey 
                })
            });
            
            if (!response.ok) throw new Error('Create failed');
            
            await this.loadBuckets();
            this.selectBucket(bucketName);
        } catch (error) {
            console.error('Failed to create bucket:', error);
            alert('Failed to create bucket: ' + error.message);
        }
    },

    async deleteBucket() {
        if (!confirm(`Delete bucket "${this.currentBucket}"?`)) return;

        try {
            const profile = app.state.activeNatsProfile;
            const response = await fetch(`/api/kv/buckets/${this.currentBucket}?profile=${encodeURIComponent(profile)}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Delete failed');
            
            this.currentBucket = null;
            document.getElementById('kv-empty-state').style.display = 'flex';
            document.getElementById('kv-keys-container').style.display = 'none';
            document.getElementById('refresh-kv-btn').style.display = 'none';
            document.getElementById('add-kv-key-btn').style.display = 'none';
            document.getElementById('delete-bucket-btn').style.display = 'none';
            
            await this.loadBuckets();
        } catch (error) {
            console.error('Failed to delete bucket:', error);
            alert('Failed to delete bucket: ' + error.message);
        }
    },

    showAddKeyDialog() {
        const key = prompt('Enter key name:');
        if (!key) return;

        const value = prompt('Enter value:');
        if (value === null) return;

        this.putKey(key, value);
    }
};

// Initialize on load
// Initialize on load
// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log("DOM Ready");
        await app.init();
        kvManager.init();
    });
} else {
    console.log('[Init] DOM already ready, forcing init...');
    (async () => {
        await app.init();
        kvManager.init();
    })();
}
