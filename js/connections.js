/* ======================================
   CONNECTIONS – SVG bezier paths
   ====================================== */

const Connections = (() => {
    let drawingConnection = null; // { fromNodeId, fromHandle, tempPath, startX, startY }
    let connections = []; // array of { id, from, fromHandle, to, toHandle }

    function setConnections(list) { connections = list || []; }
    function getConnections() { return connections; }

    function addConnection(conn) {
        // Prevent duplicates
        const exists = connections.some(c => c.from === conn.from && c.to === conn.to && c.fromHandle === conn.fromHandle);
        if (exists) return false;
        // Prevent self-loop
        if (conn.from === conn.to) return false;
        connections.push(conn);
        return true;
    }

    function removeConnection(id) {
        connections = connections.filter(c => c.id !== id);
    }

    function removeConnectionsForNode(nodeId) {
        connections = connections.filter(c => c.from !== nodeId && c.to !== nodeId);
    }

    function renderAll(nodes) {
        const svg = document.getElementById('connections-svg');
        // Remove old paths (keep defs)
        const paths = svg.querySelectorAll('.connection-path, .conn-label-group');
        paths.forEach(p => p.remove());

        connections.forEach(conn => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return;

            const fromDef = NodeDefs.getDef(fromNode.type);
            const isAI = fromDef && fromDef.isAI;

            // Get handle positions
            const fromPos = getHandlePosition(fromNode, 'output', conn.fromHandle);
            const toPos = getHandlePosition(toNode, 'input', conn.toHandle);

            const path = createPath(fromPos, toPos, conn.id, isAI);
            svg.appendChild(path);
        });
    }

    function getHandlePosition(node, handleType, handleName) {
        const w = 220; const h = 80; // approx node size
        const x = node.x;
        const y = node.y;
        if (handleType === 'output') {
            if (handleName === 'branch-if') return { x: x + w, y: y + h * 0.3 + 8 };
            if (handleName === 'branch-else') return { x: x + w, y: y + h * 0.7 + 8 };
            return { x: x + w, y: y + h / 2 };
        } else {
            return { x: x, y: y + h / 2 };
        }
    }

    function createPath(from, to, connId, isAI) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.classList.add('connection-path');
        if (isAI) path.classList.add('ai-connection');
        path.setAttribute('data-conn-id', connId);
        path.setAttribute('d', calcBezier(from, to));

        // Right-click to delete
        path.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (window._publishedLocked) return;
            showConnectionMenu(e, connId);
        });
        return path;
    }

    function calcBezier(from, to) {
        const dx = Math.abs(to.x - from.x);
        const cp = Math.max(dx * 0.5, 80);
        return `M ${from.x} ${from.y} C ${from.x + cp} ${from.y}, ${to.x - cp} ${to.y}, ${to.x} ${to.y}`;
    }

    function updateTempPath(toX, toY) {
        if (!drawingConnection) return;
        const tp = drawingConnection.tempPath;
        const from = { x: drawingConnection.startX, y: drawingConnection.startY };
        tp.setAttribute('d', calcBezier(from, { x: toX, y: toY }));
    }

    function startDrawing(nodeId, handleName, startX, startY) {
        const svg = document.getElementById('connections-svg');
        const tp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tp.classList.add('connection-path', 'temp-path');
        tp.setAttribute('d', `M ${startX} ${startY} L ${startX} ${startY}`);
        svg.appendChild(tp);

        drawingConnection = { fromNodeId: nodeId, fromHandle: handleName, tempPath: tp, startX, startY };
    }

    function finishDrawing(toNodeId, toHandle) {
        if (!drawingConnection) return;
        const tp = drawingConnection.tempPath;
        if (tp) tp.remove();

        if (toNodeId && toNodeId !== drawingConnection.fromNodeId) {
            const conn = {
                id: 'conn_' + Date.now(),
                from: drawingConnection.fromNodeId,
                fromHandle: drawingConnection.fromHandle || 'default',
                to: toNodeId,
                toHandle: toHandle || 'default',
            };
            const added = addConnection(conn);
            drawingConnection = null;
            return added ? conn : null;
        }
        drawingConnection = null;
        return null;
    }

    function cancelDrawing() {
        if (drawingConnection && drawingConnection.tempPath) {
            drawingConnection.tempPath.remove();
        }
        drawingConnection = null;
    }

    function isDrawing() { return drawingConnection !== null; }

    function highlightPath(connId) {
        document.querySelectorAll('.connection-path').forEach(p => {
            p.classList.remove('active-path');
            if (p.getAttribute('data-conn-id') === connId) {
                p.classList.add('active-path');
            }
        });
    }

    function clearHighlights() {
        document.querySelectorAll('.connection-path').forEach(p => p.classList.remove('active-path'));
    }

    function showConnectionMenu(e, connId) {
        const existing = document.getElementById('conn-ctx-menu');
        if (existing) existing.remove();
        const menu = document.createElement('div');
        menu.id = 'conn-ctx-menu';
        menu.className = 'node-context-menu';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.innerHTML = `<button class="context-menu-item danger" id="del-conn-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg> Delete Connection</button>`;
        document.body.appendChild(menu);
        menu.querySelector('#del-conn-btn').addEventListener('click', () => {
            removeConnection(connId);
            menu.remove();
            window.CanvasController && CanvasController.render();
            window.App && App.markDirty();
        });
        document.addEventListener('click', () => menu.remove(), { once: true });
    }

    return { setConnections, getConnections, addConnection, removeConnection, removeConnectionsForNode, renderAll, startDrawing, finishDrawing, cancelDrawing, isDrawing, updateTempPath, getHandlePosition, highlightPath, clearHighlights };
})();
