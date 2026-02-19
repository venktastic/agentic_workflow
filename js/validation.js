/* ======================================
   VALIDATION ENGINE – Publish Checks
   ====================================== */

const Validation = (() => {

    function validate(nodes, connections) {
        const errors = [];

        // 1. At least one trigger
        const triggers = nodes.filter(n => n.category === 'trigger');
        if (triggers.length === 0) {
            errors.push({ nodeId: null, message: 'Workflow must have at least one Trigger node.' });
        }

        // 2. All nodes must be connected
        nodes.forEach(node => {
            const hasInput = node.category === 'trigger' || connections.some(c => c.to === node.id);
            const hasOutput = connections.some(c => c.from === node.id);
            if (!hasInput && node.category !== 'trigger') {
                errors.push({ nodeId: node.id, message: `"${node.name}" has no incoming connection.` });
            }
            // Terminal nodes (approval, action as last step) - ok without output
            // but warn if not a logical endpoint
        });

        // 3. No disconnected islands - simple connectivity check
        if (nodes.length > 1) {
            const connectedSet = new Set();
            triggers.forEach(t => bfs(t.id, nodes, connections, connectedSet));
            nodes.forEach(n => {
                if (!connectedSet.has(n.id) && n.category !== 'trigger') {
                    if (!errors.find(e => e.nodeId === n.id)) {
                        errors.push({ nodeId: n.id, message: `"${n.name}" is disconnected from the workflow.` });
                    }
                }
            });
        }

        // 4. Required config fields
        nodes.forEach(node => {
            const cfg = node.config || {};
            const cat = node.category || '';
            let missing = null;
            if (cat === 'ai' && !cfg.inputSource) missing = 'Input Source';
            if (cat === 'approval' && !cfg.role) missing = 'Approver Role';
            if (cat === 'action' && node.type === 'send_notification' && !cfg.recipient) missing = 'Recipient';
            if (cat === 'action' && node.type === 'assign_task' && !cfg.role) missing = 'Role to Assign';
            if (missing) {
                errors.push({ nodeId: node.id, message: `"${node.name}": ${missing} is required.` });
            }
        });

        // 5. Detect simple cycles (A → B → A)
        if (detectCycle(nodes, connections)) {
            errors.push({ nodeId: null, message: 'Workflow contains a circular loop. Remove cyclic connections.' });
        }

        return errors;
    }

    function bfs(startId, nodes, connections, visited) {
        const queue = [startId];
        while (queue.length) {
            const id = queue.shift();
            if (visited.has(id)) continue;
            visited.add(id);
            connections.filter(c => c.from === id).forEach(c => queue.push(c.to));
        }
    }

    function detectCycle(nodes, connections) {
        const visited = new Set();
        const stack = new Set();

        function dfs(nodeId) {
            if (stack.has(nodeId)) return true;
            if (visited.has(nodeId)) return false;
            visited.add(nodeId);
            stack.add(nodeId);
            const outs = connections.filter(c => c.from === nodeId);
            for (const c of outs) {
                if (dfs(c.to)) return true;
            }
            stack.delete(nodeId);
            return false;
        }

        return nodes.some(n => dfs(n.id));
    }

    function showErrors(errors) {
        const panel = document.getElementById('validation-panel');
        const list = document.getElementById('validation-error-list');
        panel.classList.remove('hidden');
        list.innerHTML = errors.map(e =>
            `<li class="validation-error-item">${e.message}</li>`
        ).join('');

        // Highlight error nodes
        document.querySelectorAll('.workflow-node').forEach(el => el.classList.remove('error-node'));
        errors.forEach(e => {
            if (e.nodeId) {
                const el = document.querySelector(`[data-node-id="${e.nodeId}"]`);
                if (el) el.classList.add('error-node');
            }
        });
    }

    function clearErrors() {
        const panel = document.getElementById('validation-panel');
        panel.classList.add('hidden');
        document.querySelectorAll('.workflow-node').forEach(el => el.classList.remove('error-node'));
    }

    return { validate, showErrors, clearErrors };
})();
