/* ======================================
   NODE DEFINITIONS & COMPONENT LIBRARY
   ====================================== */

const NodeDefs = (() => {

    const ICONS = {
        bolt: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
        form: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
        eye: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        aiAlert: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
        bell: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
        task: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
        refresh: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>`,
        arrowUp: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>`,
        report: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/></svg>`,
        permit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14l2 2 4-4"/></svg>`,
        observe: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>`,
        branch: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>`,
        switch: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>`,
        timer: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 3"/><path d="M5 3l4 2M19 3l-4 2"/></svg>`,
        check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
        brain: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 2A2.5 2.5 0 017 4.5v1A2.5 2.5 0 019.5 8H12"/><path d="M14.5 2A2.5 2.5 0 0117 4.5v1A2.5 2.5 0 0114.5 8H12"/><path d="M12 8v13"/><path d="M9 11.5a4.5 4.5 0 01-4.5 4.5H4"/><path d="M15 11.5a4.5 4.5 0 004.5 4.5H20"/><line x1="4" y1="16" x2="4" y2="19"/><line x1="20" y1="16" x2="20" y2="19"/></svg>`,
        shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
        compliance: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
        predict: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
        user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        users: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
        parallel: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="18"/><line x1="12" y1="2" x2="8" y2="6"/><line x1="12" y1="2" x2="16" y2="6"/><line x1="12" y1="22" x2="8" y2="18"/><line x1="12" y1="22" x2="16" y2="18"/></svg>`,
        sla: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="2" y1="2" x2="6" y2="6"/><line x1="22" y1="2" x2="18" y2="6"/></svg>`,
    };

    const CATEGORIES = [
        {
            id: 'triggers', name: 'Triggers', type: 'cat-trigger',
            icon: ICONS.bolt,
            nodes: [
                { type: 'manual_trigger', name: 'Manual Trigger', subtitle: 'Start on demand', icon: ICONS.bolt, category: 'trigger' },
                { type: 'form_submission', name: 'Form Submission', subtitle: 'Form filled by user', icon: ICONS.form, category: 'trigger' },
                { type: 'observation_raised', name: 'Observation Raised', subtitle: 'Safety observation logged', icon: ICONS.eye, category: 'trigger' },
                { type: 'incident_logged', name: 'Incident Logged', subtitle: 'HSE incident recorded', icon: ICONS.warning, category: 'trigger' },
                { type: 'scheduled_trigger', name: 'Scheduled Trigger', subtitle: 'Time-based execution', icon: ICONS.clock, category: 'trigger' },
                { type: 'inspection_form_builder', name: 'Inspection Form Builder', subtitle: 'Dynamic scored form', icon: ICONS.form, category: 'trigger' },
                { type: 'ai_risk_alert_trigger', name: 'AI Risk Alert Trigger', subtitle: 'AI-detected risk event', icon: ICONS.aiAlert, category: 'trigger', isAI: true },
            ]
        },
        {
            id: 'actions', name: 'Actions', type: 'cat-action',
            icon: ICONS.task,
            nodes: [
                { type: 'send_notification', name: 'Send Notification', subtitle: 'Notify via Email/App/SMS', icon: ICONS.bell, category: 'action' },
                { type: 'assign_task', name: 'Assign Task', subtitle: 'Create and assign a task', icon: ICONS.task, category: 'action' },
                { type: 'update_status', name: 'Update Status', subtitle: 'Change record status', icon: ICONS.refresh, category: 'action' },
                { type: 'escalate_role', name: 'Escalate to Role', subtitle: 'Escalate to supervisor', icon: ICONS.arrowUp, category: 'action' },
                { type: 'generate_report', name: 'Generate Report', subtitle: 'Auto-generate HSE report', icon: ICONS.report, category: 'action' },
                { type: 'create_ptw', name: 'Create PTW', subtitle: 'Issue Permit to Work', icon: ICONS.permit, category: 'action' },
                { type: 'create_observation', name: 'Create Observation', subtitle: 'Log new observation', icon: ICONS.observe, category: 'action' },
                { type: 'calculate_inspection_score', name: 'Calculate Inspection Score', subtitle: 'Calculate total form score', icon: ICONS.check, category: 'action' },
            ]
        },
        {
            id: 'logic', name: 'Logic', type: 'cat-logic',
            icon: ICONS.branch,
            nodes: [
                { type: 'if_else', name: 'If / Else Condition', subtitle: 'Conditional branching', icon: ICONS.branch, category: 'logic', hasMultiOutput: true },
                { type: 'multi_branch', name: 'Multi-Branch Switch', subtitle: 'Route to multiple paths', icon: ICONS.switch, category: 'logic', hasMultiOutput: true },
                { type: 'delay_timer', name: 'Delay Timer', subtitle: 'Wait before continuing', icon: ICONS.timer, category: 'logic' },
                { type: 'validation_rule', name: 'Validation Rule', subtitle: 'Enforce data rules', icon: ICONS.check, category: 'logic' },
            ]
        },
        {
            id: 'ai', name: 'AI Agent Nodes', type: 'cat-ai',
            icon: ICONS.brain,
            nodes: [
                { type: 'ai_risk_analyzer', name: 'AI Risk Analyzer', subtitle: 'Analyze risk score', icon: ICONS.brain, category: 'ai', isAI: true },
                { type: 'ai_doc_validator', name: 'AI Document Validator', subtitle: 'Validate HSE documents', icon: ICONS.shield, category: 'ai', isAI: true },
                { type: 'ai_root_cause', name: 'AI Root Cause Identifier', subtitle: 'Root cause analysis', icon: ICONS.search, category: 'ai', isAI: true },
                { type: 'ai_compliance_checker', name: 'AI Compliance Checker', subtitle: 'Check regulatory compliance', icon: ICONS.compliance, category: 'ai', isAI: true },
                { type: 'ai_predictive_escalation', name: 'AI Predictive Escalation', subtitle: 'Predict escalation path', icon: ICONS.predict, category: 'ai', isAI: true },
            ]
        },
        {
            id: 'approval', name: 'Human Approval', type: 'cat-approval',
            icon: ICONS.user,
            nodes: [
                { type: 'single_approver', name: 'Single Approver', subtitle: 'One-person approval gate', icon: ICONS.user, category: 'approval' },
                { type: 'multi_level_approval', name: 'Multi-Level Approval', subtitle: 'Sequential approval chain', icon: ICONS.users, category: 'approval' },
                { type: 'parallel_approval', name: 'Parallel Approval', subtitle: 'Simultaneous approvals', icon: ICONS.parallel, category: 'approval' },
                { type: 'sla_escalation', name: 'SLA Escalation', subtitle: 'Escalate on SLA breach', icon: ICONS.sla, category: 'approval' },
            ]
        },
    ];

    // Map type → def
    const TYPE_MAP = {};
    CATEGORIES.forEach(cat => cat.nodes.forEach(n => { TYPE_MAP[n.type] = n; }));

    function getDef(type) { return TYPE_MAP[type] || null; }

    function getCategoryType(nodeType) {
        const def = getDef(nodeType);
        if (!def) return 'action';
        return def.category;
    }

    function getNodeTypeClass(cat) {
        const map = { trigger: 'node-type-trigger', action: 'node-type-action', logic: 'node-type-logic', ai: 'node-type-ai', approval: 'node-type-approval' };
        return map[cat] || 'node-type-action';
    }

    function renderComponentLibrary(filterText = '') {
        const lib = document.getElementById('component-library');
        lib.innerHTML = '';
        const filter = filterText.toLowerCase();
        CATEGORIES.forEach(cat => {
            const filtered = cat.nodes.filter(n => !filter || n.name.toLowerCase().includes(filter) || n.subtitle.toLowerCase().includes(filter));
            if (!filtered.length) return;
            const catEl = document.createElement('div');
            catEl.className = 'component-category';
            catEl.innerHTML = `
        <div class="category-header ${cat.type}">
          <div class="category-header-left">
            <div class="category-icon-wrap">${cat.icon}</div>
            <span class="category-name">${cat.name}</span>
            <span class="category-count">${filtered.length}</span>
          </div>
          <span class="category-chevron"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></span>
        </div>
        <div class="category-nodes">
          ${filtered.map(n => `
            <div class="node-item ${n.isAI ? 'ai-node' : ''}" 
                 draggable="true" 
                 data-node-type="${n.type}"
                 data-category="${n.category}">
              <div class="node-item-icon" style="${getIconStyle(n.category, n.isAI)}">${n.icon}</div>
              <div class="node-item-text">
                <div class="node-item-name">${n.name}</div>
                <div class="node-item-sub">${n.subtitle}</div>
              </div>
              ${n.isAI ? '<span class="ai-badge">AI</span>' : ''}
            </div>
          `).join('')}
        </div>
      `;
            // Toggle collapse
            const header = catEl.querySelector('.category-header');
            const nodes = catEl.querySelector('.category-nodes');
            header.addEventListener('click', () => {
                header.classList.toggle('collapsed');
                nodes.classList.toggle('collapsed');
            });
            lib.appendChild(catEl);
        });
    }

    function getIconStyle(category, isAI) {
        if (isAI) return 'background:rgba(0,209,160,0.15);color:#00d1a0;';
        const map = {
            trigger: 'background:rgba(59,130,246,0.15);color:#60a5fa;',
            action: 'background:rgba(100,116,139,0.15);color:#93c5fd;',
            logic: 'background:rgba(245,158,11,0.15);color:#fbbf24;',
            ai: 'background:rgba(0,209,160,0.15);color:#00d1a0;',
            approval: 'background:rgba(167,139,250,0.15);color:#a78bfa;',
        };
        return map[category] || '';
    }

    return { CATEGORIES, getDef, getCategoryType, getNodeTypeClass, renderComponentLibrary, ICONS };
})();
