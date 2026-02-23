/* ======================================
   PREVIEW / SIMULATION MODE
   ====================================== */

const PreviewMode = (() => {
    let active = false;

    function activate() {
        active = true;
        document.getElementById('canvas-wrapper').classList.add('preview-mode-active');
        document.getElementById('exec-log-panel').classList.remove('hidden');
        document.getElementById('preview-btn').textContent = 'Stop Preview';
        document.getElementById('preview-btn').classList.add('btn-accent');
        document.getElementById('builder-body').style.pointerEvents = 'auto';

        // Show inspection inputs if workflow has form builder
        const hasForm = CanvasController.getNodes().some(n => n.type === 'inspection_form_builder');
        if (document.getElementById('standard-sim-inputs')) {
            document.getElementById('standard-sim-inputs').style.display = hasForm ? 'none' : 'flex';
        }
        if (document.getElementById('inspection-sim-inputs')) {
            document.getElementById('inspection-sim-inputs').style.display = hasForm ? 'flex' : 'none';
        }

        clearLog();
        Toast.show('Preview mode active — run simulation below', 'info');
    }

    function deactivate() {
        active = false;
        document.getElementById('canvas-wrapper').classList.remove('preview-mode-active');
        document.getElementById('exec-log-panel').classList.add('hidden');
        document.getElementById('preview-btn').textContent = '▶ Preview';
        document.getElementById('preview-btn').innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Preview`;
        Connections.clearHighlights();
        document.querySelectorAll('.workflow-node').forEach(el => {
            el.classList.remove('preview-active', 'preview-done');
        });
    }

    function isActive() { return active; }

    function clearLog() {
        document.getElementById('exec-log-body').innerHTML = '<div class="log-placeholder">Press "Run Simulation" to execute the workflow.</div>';
    }

    async function runSimulation() {
        const nodes = CanvasController.getNodes();
        const connections = Connections.getConnections();
        const severity = document.getElementById('sim-severity').value;
        const riskScore = parseInt(document.getElementById('sim-risk-score').value) || 85;
        const valConfEl = document.getElementById('sim-val-conf');
        const validationConfidence = valConfEl ? (parseInt(valConfEl.value) || 40) : 40;

        // Form scores
        const q1 = parseInt(document.getElementById('sim-q1') ? document.getElementById('sim-q1').value : 0) || 0;
        const q2 = parseInt(document.getElementById('sim-q2') ? document.getElementById('sim-q2').value : 0) || 0;
        const q3 = parseInt(document.getElementById('sim-q3') ? document.getElementById('sim-q3').value : 0) || 0;
        const totalInspectionScore = q1 + q2 + q3;

        clearLog();

        // Find trigger node
        const triggers = nodes.filter(n => n.category === 'trigger');
        if (!triggers.length) {
            appendLog('error', 'No trigger node found. Add a Trigger to start.', 'System');
            return;
        }

        let step = 1;
        const delay = ms => new Promise(r => setTimeout(r, ms));

        appendLog('trigger', `Workflow triggered`, `${triggers[0].name} activated`, step++);
        await delay(600);
        highlightNode(triggers[0].id, 'active');
        await delay(800);
        highlightNode(triggers[0].id, 'done');

        // Traverse execution path
        let currentId = triggers[0].id;
        const visited = new Set([currentId]);
        let maxIter = 20;

        while (currentId && maxIter-- > 0) {
            const outConns = connections.filter(c => c.from === currentId);
            if (!outConns.length) break;

            for (const conn of outConns) {
                if (visited.has(conn.to)) continue;
                visited.add(conn.to);

                const node = nodes.find(n => n.id === conn.to);
                if (!node) continue;

                // Highlight connection
                Connections.highlightPath(conn.id);
                await delay(500);

                // Process node
                const result = processNode(node, { severity, riskScore, totalInspectionScore });
                appendLog(result.logType, result.message, result.detail, step++);
                await delay(400);
                highlightNode(node.id, 'active');
                await delay(900);
                highlightNode(node.id, 'done');

                // If condition node, determine branch
                if (node.type === 'if_else') {
                    const cfg = node.config || {};
                    const cond = cfg.conditions && cfg.conditions[0];
                    let condMet = false;
                    if (cond) {
                        if (cond.field === 'Risk Score') {
                            if (cond.operator === '>' && riskScore > parseInt(cond.value || 0)) condMet = true;
                            if (cond.operator === '<' && riskScore < parseInt(cond.value || 100)) condMet = true;
                            if (cond.operator === '=' && riskScore === parseInt(cond.value || 0)) condMet = true;
                        }
                        if (cond.field === 'Total Score') {
                            if (cond.operator === '>' && totalInspectionScore > parseInt(cond.value || 0)) condMet = true;
                            if (cond.operator === '<' && totalInspectionScore < parseInt(cond.value || 0)) condMet = true;
                            if (cond.operator === '=' && totalInspectionScore === parseInt(cond.value || 0)) condMet = true;
                        }
                        if (cond.field === 'Validation Confidence') {
                            if (cond.operator === '>' && validationConfidence > parseInt(cond.value || 0)) condMet = true;
                            if (cond.operator === '<' && validationConfidence < parseInt(cond.value || 100)) condMet = true;
                            if (cond.operator === '=' && validationConfidence === parseInt(cond.value || 0)) condMet = true;
                        }
                        if (cond.field === 'Severity') {
                            const sev = { minor: 1, moderate: 2, major: 3, critical: 4 };
                            const sevVal = sev[severity] || 1;
                            const cmpVal = sev[cond.value.toLowerCase()] || 2;
                            if (cond.operator === '>' && sevVal > cmpVal) condMet = true;
                            if (cond.operator === '=' && sevVal === cmpVal) condMet = true;
                        }
                    }
                    const branch = condMet ? 'branch-if' : 'branch-else';
                    const branchLabel = condMet ? 'TRUE → proceeding' : 'FALSE → alternate path';
                    appendLog('condition', `Condition evaluated: ${branchLabel}`, `Field: ${cond ? cond.field : 'N/A'} ${cond ? cond.operator : ''} ${cond ? cond.value : ''}`, step++);
                    // Follow the matching branch
                    const branchConn = connections.find(c => c.from === node.id && c.fromHandle === branch);
                    if (branchConn) {
                        currentId = branchConn.to;
                    } else {
                        currentId = null;
                    }
                    await delay(300);
                    break;
                } else {
                    currentId = conn.to;
                }
                break; // Follow first path by default
            }
        }

        await delay(500);
        appendLog('success', 'Workflow execution complete', `Processed ${step - 1} steps successfully`, step++);
    }

    function processNode(node, simData) {
        const cat = node.category || '';
        const cfg = node.config || {};
        if (node.type === 'inspection_form_builder') {
            return { logType: 'trigger', message: `${node.name} executed`, detail: `Answers submitted — Computing evaluation.` };
        }
        if (node.type === 'calculate_inspection_score') {
            const sum = simData.totalInspectionScore;
            let risk = 'High';
            if (sum <= (cfg.thresholdLow || 10)) risk = 'Low';
            else if (sum <= (cfg.thresholdMedium || 20)) risk = 'Medium';
            return { logType: 'success', message: `${node.name} completed`, detail: `Calculated Score: ${sum} — Risk: ${risk}` };
        }
        if (cat === 'ai') {
            return { logType: 'ai', message: `${node.name} executed`, detail: `Analyzed input — confidence: ${cfg.confidence || 80}% — Output: ${cfg.outputMap || 'Risk Score'}` };
        }
        if (cat === 'approval') {
            return { logType: 'approval', message: `${node.name} gate reached`, detail: `Awaiting: ${cfg.role || 'Approver'} — SLA: ${cfg.slaHours || 24}h` };
        }
        if (cat === 'logic') {
            return { logType: 'condition', message: `Logic node: ${node.name}`, detail: `Evaluating conditions...` };
        }
        if (node.type === 'send_notification') {
            return { logType: 'action', message: `Notification sent`, detail: `To: ${cfg.recipient || 'Stakeholders'} via ${cfg.channel || 'Email'}` };
        }
        if (node.type === 'escalate_role') {
            return { logType: 'action', message: `Escalated`, detail: `Escalated to: ${cfg.role || 'Corporate HSE'}` };
        }
        return { logType: 'action', message: `${node.name} executed`, detail: `Action completed successfully` };
    }

    function highlightNode(nodeId, state) {
        const el = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (!el) return;
        el.classList.remove('preview-active', 'preview-done');
        if (state === 'active') el.classList.add('preview-active');
        if (state === 'done') el.classList.add('preview-done');
    }

    function appendLog(type, message, detail, step) {
        const body = document.getElementById('exec-log-body');
        const ph = body.querySelector('.log-placeholder');
        if (ph) ph.remove();

        const now = new Date().toLocaleTimeString('en-US', { hour12: false });
        const typeIcons = {
            trigger: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
            ai: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00d1a0" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
            condition: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/></svg>',
            action: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" stroke-width="2"><polyline points="9 11 12 14 22 4"/></svg>',
            approval: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            success: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
            error: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        };

        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.innerHTML = `
      <span class="log-step">STEP ${step || ''}</span>
      <div class="log-icon">${typeIcons[type] || typeIcons.action}</div>
      <div class="log-message">${message}${detail ? `<span class="log-detail">${detail}</span>` : ''}</div>
      <span class="log-timestamp">${now}</span>
    `;
        body.appendChild(entry);
        body.scrollTop = body.scrollHeight;
    }

    return { activate, deactivate, isActive, runSimulation };
})();
