/* ======================================
   CANVAS CONTROLLER
   Infinite scroll, zoom/pan, drag nodes, 
   drop from library, connect handles
   ====================================== */

const CanvasController = (() => {
    let nodes = [];
    let zoom = 1;
    let panX = 0, panY = 0;
    const MIN_ZOOM = 0.2;
    const MAX_ZOOM = 2.0;
    const GRID_SIZE = 16;

    let isDraggingNode = null;
    let dragOffsetX = 0, dragOffsetY = 0;
    let isPanning = false;
    let panStartX = 0, panStartY = 0;
    let selectedNodeId = null;
    let contextMenuEl = null;

    let _dragFromLibrary = false;

    // Prevent duplicate global event listeners across builder re-opens
    let _globalEventsBound = false;
    let _globalAbortCtrl = null;

    function init(_nodes, _connections) {
        nodes = _nodes || [];
        Connections.setConnections(_connections || []);
        applyTransform();
        render();
        bindEvents();
        updateDropHint();
        updateMinimap();
    }

    function getNodes() { return nodes; }

    function setNodes(n) {
        nodes = n;
        render();
        updateDropHint();
        updateMinimap();
    }

    function snapToGrid(val) { return Math.round(val / GRID_SIZE) * GRID_SIZE; }

    function applyTransform() {
        const container = document.getElementById('canvas-container');
        container.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
        const pct = Math.round(zoom * 100) + '%';
        document.getElementById('zoom-label').textContent = pct;
        document.getElementById('canvas-zoom-label').textContent = pct;
    }

    function render() {
        renderNodes();
        Connections.renderAll(nodes);
        updateMinimap();
    }

    function renderNodes() {
        const layer = document.getElementById('nodes-layer');
        // Keep track of existing node elements
        const existingIds = new Set(nodes.map(n => n.id));
        layer.querySelectorAll('.workflow-node').forEach(el => {
            if (!existingIds.has(el.dataset.nodeId)) el.remove();
        });

        nodes.forEach(node => {
            let el = layer.querySelector(`[data-node-id="${node.id}"]`);
            if (!el) {
                el = createNodeElement(node);
                layer.appendChild(el);
            }
            el.style.left = node.x + 'px';
            el.style.top = node.y + 'px';
            updateNodeElement(el, node);
        });
    }

    function createNodeElement(node) {
        const def = NodeDefs.getDef(node.type) || {};
        const catType = NodeDefs.getNodeTypeClass(node.category || def.category || 'action');
        const isAI = def.isAI || node.category === 'ai';
        const isLogic = node.category === 'logic' || def.category === 'logic';

        const el = document.createElement('div');
        el.className = `workflow-node ${catType} ${isAI ? 'ai-node' : ''}`;
        el.dataset.nodeId = node.id;
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';

        const configState = getConfigState(node);
        const iconStyle = getIconStyleInline(node.category || def.category);

        el.innerHTML = `
      ${isAI ? '<div class="ai-node-shimmer"></div>' : ''}
      <div class="connection-handles">
        <div class="node-handle node-handle-input" data-node-id="${node.id}" data-handle="input" title="Connect here"></div>
        <div class="node-header">
          <div class="node-icon-wrap" style="${iconStyle}">${def.icon || ''}</div>
          <div class="node-title-wrap">
            <div class="node-title">${node.name || def.name || node.type}</div>
            <div class="node-subtitle">${def.subtitle || ''}</div>
          </div>
          <div class="node-status-dot ${configState}" title="${configState}"></div>
          <button class="node-menu-btn" data-node-id="${node.id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </div>
        ${isLogic && node.type === 'if_else' ? `
          <div class="node-handle node-handle-output branch-if" data-node-id="${node.id}" data-handle="branch-if" title="True"></div>
          <div class="node-handle node-handle-output branch-else" data-node-id="${node.id}" data-handle="branch-else" title="False"></div>
          <span class="branch-label true-label">TRUE</span>
          <span class="branch-label false-label">FALSE</span>
        ` : `<div class="node-handle node-handle-output" data-node-id="${node.id}" data-handle="default" title="Drag to connect"></div>`}
      </div>
      <div class="node-body">
        <div class="node-config-summary" id="node-summary-${node.id}"></div>
        ${isAI ? `<div class="ai-node-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> AI-POWERED</div>` : ''}
      </div>
    `;

        renderNodeSummary(el.querySelector(`#node-summary-${node.id}`), node);
        bindNodeEvents(el, node.id);
        return el;
    }

    function updateNodeElement(el, node) {
        const def = NodeDefs.getDef(node.type) || {};
        const titleEl = el.querySelector('.node-title');
        if (titleEl) titleEl.textContent = node.name || def.name || node.type;
        const summaryEl = el.querySelector(`#node-summary-${node.id}`);
        if (summaryEl) renderNodeSummary(summaryEl, node);
        const dot = el.querySelector('.node-status-dot');
        if (dot) { dot.className = 'node-status-dot ' + getConfigState(node); }
        // Selected state
        el.classList.toggle('selected', node.id === selectedNodeId);
        el.classList.toggle('published-locked', !!window._publishedLocked);
    }

    function renderNodeSummary(el, node) {
        if (!el) return;
        const cfg = node.config || {};
        const parts = [];
        if (cfg.recipient) parts.push(`<span class="node-config-tag">To: ${cfg.recipient}</span>`);
        if (cfg.channel) parts.push(`<span class="node-config-tag">${cfg.channel}</span>`);
        if (cfg.role) parts.push(`<span class="node-config-tag">${cfg.role}</span>`);
        if (cfg.field && cfg.operator && cfg.value !== undefined) parts.push(`<span class="node-config-tag">${cfg.field} ${cfg.operator} ${cfg.value}</span>`);
        if (cfg.confidence !== undefined) parts.push(`<span class="node-config-tag">Conf: ${cfg.confidence}%</span>`);
        if (cfg.delay) parts.push(`<span class="node-config-tag">Delay: ${cfg.delay}${cfg.delayUnit || 'm'}</span>`);
        if (cfg.schedule) parts.push(`<span class="node-config-tag">${cfg.schedule}</span>`);
        el.innerHTML = parts.length ? parts.join('') : '<span style="color:var(--text-muted);font-size:10px;">Click to configure</span>';
    }

    function getConfigState(node) {
        const def = NodeDefs.getDef(node.type) || {};
        const cat = node.category || def.category || '';
        const cfg = node.config || {};
        if (cat === 'trigger') return 'configured';
        if (cat === 'ai' && cfg.inputSource) return 'configured';
        if (cat === 'action' && (cfg.recipient || cfg.role || cfg.status)) return 'configured';
        if (cat === 'logic' && cfg.field) return 'configured';
        if (cat === 'approval' && cfg.role) return 'configured';
        return 'missing';
    }

    function getIconStyleInline(category) {
        const map = {
            trigger: 'background:rgba(59,130,246,0.15);color:#60a5fa;',
            action: 'background:rgba(100,116,139,0.15);color:#93c5fd;',
            logic: 'background:rgba(245,158,11,0.15);color:#fbbf24;',
            ai: 'background:rgba(0,209,160,0.15);color:#00d1a0;',
            approval: 'background:rgba(167,139,250,0.15);color:#a78bfa;',
        };
        return map[category] || map['action'];
    }

    function bindNodeEvents(el, nodeId) {
        // Click to select
        el.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            if (e.target.closest('.node-handle') || e.target.closest('.node-menu-btn')) return;
            e.stopPropagation();
            selectNode(nodeId);
            if (window._publishedLocked) return;
            // Start drag
            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;
            isDraggingNode = node;
            const canvasRect = getCanvasRect();
            dragOffsetX = (e.clientX - canvasRect.left) / zoom - node.x;
            dragOffsetY = (e.clientY - canvasRect.top) / zoom - node.y;
            el.classList.add('dragging');
        });

        // Menu button
        const menuBtn = el.querySelector('.node-menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showNodeContextMenu(e, nodeId);
            });
        }

        // Handle output – start connection
        el.querySelectorAll('.node-handle-output').forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (window._publishedLocked) return;
                e.stopPropagation();
                const node = nodes.find(n => n.id === nodeId);
                if (!node) return;
                const canvasRect = getCanvasRect();
                const hRect = handle.getBoundingClientRect();
                const sx = (hRect.left + hRect.width / 2 - canvasRect.left) / zoom;
                const sy = (hRect.top + hRect.height / 2 - canvasRect.top) / zoom;
                Connections.startDrawing(nodeId, handle.dataset.handle, sx, sy);
            });
        });

        // Handle input – accept connection
        el.querySelectorAll('.node-handle-input').forEach(handle => {
            handle.addEventListener('mouseenter', () => { if (Connections.isDrawing()) handle.classList.add('accepting'); });
            handle.addEventListener('mouseleave', () => handle.classList.remove('accepting'));
            handle.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                handle.classList.remove('accepting');
                const conn = Connections.finishDrawing(nodeId, handle.dataset.handle);
                if (conn) { render(); App.markDirty(); Toast.show('Connection created', 'success'); }
            });
        });
    }

    function selectNode(id) {
        selectedNodeId = id;
        document.querySelectorAll('.workflow-node').forEach(el => {
            el.classList.toggle('selected', el.dataset.nodeId === id);
        });
        if (id) {
            const node = nodes.find(n => n.id === id);
            if (node) ConfigPanel.show(node);
        } else {
            ConfigPanel.clear();
        }
    }

    function getSelectedNode() { return nodes.find(n => n.id === selectedNodeId) || null; }

    function showNodeContextMenu(e, nodeId) {
        if (contextMenuEl) contextMenuEl.remove();
        contextMenuEl = document.createElement('div');
        contextMenuEl.className = 'node-context-menu';
        contextMenuEl.style.left = e.clientX + 'px';
        contextMenuEl.style.top = e.clientY + 'px';
        contextMenuEl.innerHTML = `
      <button class="context-menu-item" id="ctx-dup">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        Duplicate
      </button>
      <div class="context-menu-divider"></div>
      <button class="context-menu-item danger" id="ctx-del">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        Delete Node
      </button>
    `;
        document.body.appendChild(contextMenuEl);

        contextMenuEl.querySelector('#ctx-dup').addEventListener('click', () => {
            duplicateNode(nodeId); contextMenuEl.remove();
        });
        contextMenuEl.querySelector('#ctx-del').addEventListener('click', () => {
            deleteNode(nodeId); contextMenuEl.remove();
        });
        setTimeout(() => document.addEventListener('click', () => { if (contextMenuEl) contextMenuEl.remove(); }, { once: true }), 10);
    }

    function addNode(type, x, y) {
        const def = NodeDefs.getDef(type);
        if (!def) return null;
        const node = {
            id: 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            type,
            name: def.name,
            category: def.category,
            x: snapToGrid(x), y: snapToGrid(y),
            config: {},
        };
        nodes.push(node);
        render();
        updateDropHint();
        App.markDirty();
        selectNode(node.id);
        return node;
    }

    function deleteNode(nodeId) {
        nodes = nodes.filter(n => n.id !== nodeId);
        Connections.removeConnectionsForNode(nodeId);
        if (selectedNodeId === nodeId) { selectedNodeId = null; ConfigPanel.clear(); }
        render();
        updateDropHint();
        App.markDirty();
        Toast.show('Node deleted', 'info');
    }

    function duplicateNode(nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        const newNode = JSON.parse(JSON.stringify(node));
        newNode.id = 'node_' + Date.now();
        newNode.x = node.x + 32;
        newNode.y = node.y + 32;
        nodes.push(newNode);
        render();
        App.markDirty();
        Toast.show('Node duplicated', 'success');
    }

    function updateNodeConfig(nodeId, config) {
        const node = nodes.find(n => n.id === nodeId);
        if (node) { node.config = { ...node.config, ...config }; render(); App.markDirty(); }
    }

    function bindEvents() {
        if (_globalEventsBound) return;
        _globalEventsBound = true;

        const wrapper = document.getElementById('canvas-wrapper');
        _globalAbortCtrl = new AbortController();
        const sig = { signal: _globalAbortCtrl.signal };

        // ─── Canvas-local events (now bound once) ───

        // Middle mouse / alt+drag to pan
        wrapper.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.altKey)) {
                e.preventDefault();
                isPanning = true;
                panStartX = e.clientX;
                panStartY = e.clientY;
                wrapper.classList.add('panning');
            } else if (e.button === 0 && !e.target.closest('.workflow-node')) {
                if (!e.target.closest('.canvas-controls') && !e.target.closest('.minimap-container')) {
                    selectNode(null);
                }
            }
        }, sig);

        // Wheel zoom
        wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = -e.deltaY * 0.001 * zoom;
            const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
            const rect = wrapper.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            panX = mx - (mx - panX) * (newZoom / zoom);
            panY = my - (my - panY) * (newZoom / zoom);
            zoom = newZoom;
            applyTransform();
            updateMinimap();
        }, { passive: false, signal: sig.signal }); // note: signal needs to be passed explicitly here if using options

        // Drag-over / drop (from library)
        wrapper.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (_dragFromLibrary) wrapper.classList.add('drag-over');
        }, sig);

        wrapper.addEventListener('dragleave', () => wrapper.classList.remove('drag-over'), sig);

        wrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            wrapper.classList.remove('drag-over');
            if (window._publishedLocked) return;
            if (!_dragFromLibrary) return; // Only allow drops initiated from library

            const type = e.dataTransfer.getData('node-type');
            if (!type) return;

            const rect = wrapper.getBoundingClientRect();
            const cx = (e.clientX - rect.left - panX) / zoom;
            const cy = (e.clientY - rect.top - panY) / zoom;
            addNode(type, cx - 110, cy - 40);

            _dragFromLibrary = false; // Reset flag
        }, sig);

        // ─── Global events ───

        // Mouse up anywhere = finish connection or end drag
        window.addEventListener('mouseup', (e) => {
            if (Connections.isDrawing()) { Connections.cancelDrawing(); }
            if (isDraggingNode) {
                document.querySelectorAll('.workflow-node').forEach(el => el.classList.remove('dragging'));
                isDraggingNode = null;
                App.markDirty();
            }
            if (isPanning) {
                isPanning = false;
                const w = document.getElementById('canvas-wrapper');
                if (w) w.classList.remove('panning');
            }
            // Always reset library drag flag on mouseup just in case
            _dragFromLibrary = false;
        }, sig);

        // Mouse move – drag node or draw connection or pan
        window.addEventListener('mousemove', (e) => {
            if (isDraggingNode) {
                const canvasRect = getCanvasRect();
                const nx = snapToGrid((e.clientX - canvasRect.left) / zoom - dragOffsetX);
                const ny = snapToGrid((e.clientY - canvasRect.top) / zoom - dragOffsetY);
                isDraggingNode.x = nx;
                isDraggingNode.y = ny;
                const el = document.querySelector(`[data-node-id="${isDraggingNode.id}"]`);
                if (el) { el.style.left = nx + 'px'; el.style.top = ny + 'px'; }
                Connections.renderAll(nodes);
                updateMinimap();
                return;
            }
            if (Connections.isDrawing()) {
                const canvasRect = getCanvasRect();
                const cx = (e.clientX - canvasRect.left) / zoom;
                const cy = (e.clientY - canvasRect.top) / zoom;
                Connections.updateTempPath(cx, cy);
                return;
            }
            if (isPanning) {
                panX += e.clientX - panStartX;
                panY += e.clientY - panStartY;
                panStartX = e.clientX;
                panStartY = e.clientY;
                applyTransform();
                updateMinimap();
            }
        }, sig);

        // Node library drag-start (only bound once – delegate from static parent)
        document.getElementById('component-library').addEventListener('dragstart', (e) => {
            const item = e.target.closest('.node-item');
            if (!item) return;
            _dragFromLibrary = true; // Set flag
            e.dataTransfer.setData('node-type', item.dataset.nodeType);
        }, sig);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedNodeId && !window._publishedLocked) { deleteNode(selectedNodeId); }
            }
            if (e.key === 'Escape') { selectNode(null); Connections.cancelDrawing(); }
        }, sig);

        // Zoom buttons
        document.getElementById('zoom-in-btn').addEventListener('click', () => setZoom(zoom * 1.2), sig);
        document.getElementById('zoom-out-btn').addEventListener('click', () => setZoom(zoom / 1.2), sig);
        document.getElementById('fit-view-btn').addEventListener('click', fitView, sig);
        document.getElementById('reset-view-btn').addEventListener('click', resetView, sig);
    }

    function setZoom(z) {
        const wrapper = document.getElementById('canvas-wrapper');
        const rect = wrapper.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
        panX = cx - (cx - panX) * (newZoom / zoom);
        panY = cy - (cy - panY) * (newZoom / zoom);
        zoom = newZoom;
        applyTransform();
        updateMinimap();
    }

    function fitView() {
        if (!nodes.length) return;
        const wrapper = document.getElementById('canvas-wrapper');
        const rect = wrapper.getBoundingClientRect();
        const minX = Math.min(...nodes.map(n => n.x));
        const maxX = Math.max(...nodes.map(n => n.x + 220));
        const minY = Math.min(...nodes.map(n => n.y));
        const maxY = Math.max(...nodes.map(n => n.y + 80));
        const w = maxX - minX, h = maxY - minY;
        zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min((rect.width - 80) / w, (rect.height - 80) / h)));
        panX = (rect.width - w * zoom) / 2 - minX * zoom;
        panY = (rect.height - h * zoom) / 2 - minY * zoom;
        applyTransform();
        updateMinimap();
    }

    function resetView() { zoom = 1; panX = 60; panY = 60; applyTransform(); updateMinimap(); }

    function getCanvasRect() {
        return document.getElementById('canvas-wrapper').getBoundingClientRect();
    }

    function updateDropHint() {
        const hint = document.getElementById('drop-hint');
        if (nodes.length > 0) hint.classList.add('hidden');
        else hint.classList.remove('hidden');
    }

    function updateMinimap() {
        const canvas = document.getElementById('minimap-canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 160, 100);
        ctx.fillStyle = 'rgba(30,40,64,0.5)';
        ctx.fillRect(0, 0, 160, 100);
        if (!nodes.length) return;
        const scaleX = 160 / 4000;
        const scaleY = 100 / 4000;
        // Draw viewport rect
        const wrapper = document.getElementById('canvas-wrapper');
        const rect = wrapper.getBoundingClientRect();
        const vx = (-panX / zoom) * scaleX;
        const vy = (-panY / zoom) * scaleY;
        const vw = (rect.width / zoom) * scaleX;
        const vh = (rect.height / zoom) * scaleY;
        ctx.strokeStyle = 'rgba(59,130,246,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(vx, vy, vw, vh);
        // Draw nodes
        nodes.forEach(n => {
            const def = NodeDefs.getDef(n.type) || {};
            const isAI = def.isAI || n.category === 'ai';
            ctx.fillStyle = isAI ? '#00d1a0' : n.category === 'trigger' ? '#3b82f6' : n.category === 'approval' ? '#7c3aed' : '#475569';
            ctx.fillRect((n.x - 0) * scaleX, (n.y - 0) * scaleY, 220 * scaleX, 70 * scaleY);
        });
    }

    return { init, getNodes, setNodes, addNode, deleteNode, duplicateNode, updateNodeConfig, selectNode, getSelectedNode, render, fitView, resetView, setZoom };
})();
