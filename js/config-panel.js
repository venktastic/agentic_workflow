/* ======================================
   CONFIG PANEL – Dynamic node configuration
   ====================================== */

const ConfigPanel = (() => {

    function show(node) {
        const def = NodeDefs.getDef(node.type) || {};
        const title = document.getElementById('right-panel-title');
        const content = document.getElementById('config-panel-content');
        const panel = document.getElementById('right-panel');
        panel.classList.remove('collapsed');
        title.textContent = 'Configure Node';

        const isAI = def.isAI || node.category === 'ai';
        const catColor = getCatColor(node.category || def.category);

        let html = `
      <div class="config-node-header">
        <div class="config-node-icon" style="background:${catColor.bg};color:${catColor.color};">${def.icon || ''}</div>
        <div>
          <div class="config-node-name">${node.name || def.name}</div>
          <div class="config-node-type">${def.subtitle || (node.category || '').toUpperCase()}</div>
        </div>
      </div>
    `;

        html += buildFieldsHTML(node, def);

        html += `
      <div class="config-section-divider"></div>
      <div class="field-group">
        <label class="field-label">Node Label</label>
        <input type="text" class="field-input" id="cfg-node-name" value="${escapeHtml(node.name || def.name || '')}" placeholder="Custom node name" />
      </div>
    `;

        content.innerHTML = html;

        // Bind changes
        const cfg = node.config || {};
        bindFieldEvents(node, def);

        // Node name change
        const nameInput = document.getElementById('cfg-node-name');
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                node.name = nameInput.value;
                const el = document.querySelector(`[data-node-id="${node.id}"] .node-title`);
                if (el) el.textContent = node.name;
                App.markDirty();
            });
        }
    }

    function buildFieldsHTML(node, def) {
        const cfg = node.config || {};
        const cat = node.category || def.category || '';
        let html = '';

        if (cat === 'trigger') {
            html += buildTriggerFields(node.type, cfg);
        } else if (cat === 'action') {
            html += buildActionFields(node.type, cfg);
        } else if (cat === 'logic') {
            html += buildLogicFields(node.type, cfg);
        } else if (cat === 'ai') {
            html += buildAIFields(node.type, cfg);
        } else if (cat === 'approval') {
            html += buildApprovalFields(node.type, cfg);
        }

        return html;
    }

    function buildTriggerFields(type, cfg) {
        const schedules = ['Daily at 08:00', 'Weekly Monday', 'Monthly 1st', 'Every 6 hours'];
        if (type === 'scheduled_trigger') {
            return `
        <div class="field-group">
          <label class="field-label">Schedule</label>
          <select class="field-select" data-cfg="schedule">
            ${schedules.map(s => `<option value="${s}" ${cfg.schedule === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Timezone</label>
          <select class="field-select" data-cfg="timezone">
            <option value="UTC+5:30" ${cfg.timezone === 'UTC+5:30' ? 'selected' : ''}>UTC+5:30 (IST)</option>
            <option value="UTC">UTC</option>
            <option value="UTC+4">UTC+4 (Gulf)</option>
          </select>
        </div>`;
        }
        if (type === 'ai_risk_alert_trigger') {
            return `
        <div class="field-group">
          <label class="field-label">Trigger Threshold</label>
          <div class="field-slider-wrap">
            <input type="range" class="field-slider" min="50" max="100" value="${cfg.threshold || 70}" data-cfg="threshold" />
            <span class="field-slider-val">${cfg.threshold || 70}</span>
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">Risk Category</label>
          <select class="field-select" data-cfg="riskCategory">
            ${['Physical', 'Chemical', 'Biological', 'Ergonomic', 'Environmental', 'Fire'].map(r => `<option value="${r}" ${cfg.riskCategory === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>`;
        }
        return `<div class="field-group"><label class="field-label">Description</label><textarea class="field-textarea" data-cfg="description" placeholder="Describe trigger conditions...">${cfg.description || ''}</textarea></div>`;
    }

    function buildActionFields(type, cfg) {
        let html = '';
        if (type === 'send_notification') {
            html += `
        <div class="field-group">
          <label class="field-label">Recipient Role</label>
          <select class="field-select" data-cfg="recipient">
            ${['Site HSE Officer', 'Area Manager', 'Corporate HSE', 'Contractor Supervisor', 'Emergency Response Team', 'All Stakeholders'].map(r => `<option value="${r}" ${cfg.recipient === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Message Template</label>
          <textarea class="field-textarea" data-cfg="message" placeholder="Enter message...">${cfg.message || 'Attention: An HSE event requires your immediate action.'}</textarea>
        </div>
        <div class="field-group">
          <label class="field-label">Channels</label>
          <div class="channel-chips">
            ${['Email', 'WhatsApp', 'In-App', 'SMS', 'Teams'].map(ch => `<button class="channel-chip ${(cfg.channel || '').includes(ch) ? 'active' : ''}" data-channel="${ch}">${ch}</button>`).join('')}
          </div>
        </div>`;
        } else if (type === 'assign_task') {
            html += `
        <div class="field-group">
          <label class="field-label">Assign To Role</label>
          <select class="field-select" data-cfg="role">
            ${['HSE Officer', 'Area Manager', 'Safety Inspector', 'Contractor Supervisor', 'Corporate HSE'].map(r => `<option value="${r}" ${cfg.role === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Task Title</label>
          <input type="text" class="field-input" data-cfg="taskTitle" value="${cfg.taskTitle || ''}" placeholder="e.g. Investigate root cause" />
        </div>
        <div class="field-group">
          <label class="field-label">Due In (hours)</label>
          <input type="number" class="field-input" data-cfg="dueHours" value="${cfg.dueHours || 24}" min="1" max="720" />
        </div>`;
        } else if (type === 'escalate_role') {
            html += `
        <div class="field-group">
          <label class="field-label">Escalate To</label>
          <select class="field-select" data-cfg="role">
            ${['Corporate HSE Director', 'Regional Manager', 'Emergency Response Team', 'Board Risk Committee', 'Government Authority'].map(r => `<option value="${r}" ${cfg.role === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Escalation Reason</label>
          <textarea class="field-textarea" data-cfg="reason" placeholder="Reason for escalation...">${cfg.reason || ''}</textarea>
        </div>`;
        } else if (type === 'update_status') {
            html += `
        <div class="field-group">
          <label class="field-label">Record Type</label>
          <select class="field-select" data-cfg="recordType">
            ${['Incident', 'Observation', 'PTW', 'Task', 'Audit'].map(r => `<option value="${r}" ${cfg.recordType === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">New Status</label>
          <select class="field-select" data-cfg="status">
            ${['Under Investigation', 'Escalated', 'Closed', 'Pending Approval', 'Archived'].map(s => `<option value="${s}" ${cfg.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>`;
        } else {
            html += `<div class="field-group"><label class="field-label">Description</label><textarea class="field-textarea" data-cfg="description" placeholder="Describe this action...">${cfg.description || ''}</textarea></div>`;
        }
        return html;
    }

    function buildLogicFields(type, cfg) {
        let html = '';
        if (type === 'if_else') {
            const conditions = cfg.conditions || [{ field: 'Risk Score', operator: '>', value: '75' }];
            html += `
        <div class="field-group">
          <label class="field-label">Conditions (AND)</label>
          <div class="conditions-list" id="conditions-list">
            ${conditions.map((c, i) => `
              <div class="condition-row" data-idx="${i}">
                <select class="field-select" data-cfg-arr="conditions[${i}].field">
                  ${['Risk Score', 'Severity', 'Category', 'Location', 'Status', 'Priority'].map(f => `<option value="${f}" ${c.field === f ? 'selected' : ''}>${f}</option>`).join('')}
                </select>
                <select class="field-select" data-cfg-arr="conditions[${i}].operator">
                  ${['>', '<', '=', '≥', '≤', '≠', 'Contains', 'Not Contains'].map(o => `<option value="${o}" ${c.operator === o ? 'selected' : ''}>${o}</option>`).join('')}
                </select>
                <input type="text" class="field-input" placeholder="Value" value="${c.value || ''}" data-cfg-arr="conditions[${i}].value" />
                ${i > 0 ? `<button class="condition-remove-btn" data-idx="${i}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : ''}
              </div>
            `).join('')}
          </div>
          <button class="add-condition-btn" id="add-condition-btn">+ Add Condition</button>
        </div>`;
        } else if (type === 'delay_timer') {
            html += `
        <div class="field-group">
          <label class="field-label">Delay Duration</label>
          <input type="number" class="field-input" data-cfg="delay" value="${cfg.delay || 30}" min="1" />
        </div>
        <div class="field-group">
          <label class="field-label">Unit</label>
          <select class="field-select" data-cfg="delayUnit">
            ${['minutes', 'hours', 'days'].map(u => `<option value="${u}" ${(cfg.delayUnit || 'minutes') === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>`;
        } else if (type === 'validation_rule') {
            html += `
        <div class="field-group">
          <label class="field-label">Validate Field</label>
          <select class="field-select" data-cfg="field">
            ${['Incident Description', 'Risk Score', 'Severity', 'Attachments', 'Date', 'Location'].map(f => `<option value="${f}" ${cfg.field === f ? 'selected' : ''}>${f}</option>`).join('')}
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Rule</label>
          <select class="field-select" data-cfg="rule">
            ${['Required', 'Min Length 50', 'Must Have Attachment', 'Numeric', 'Valid Email', 'Future Date'].map(r => `<option value="${r}" ${cfg.rule === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>`;
        } else if (type === 'multi_branch') {
            html += `
        <div class="field-group">
          <label class="field-label">Branch Field</label>
          <select class="field-select" data-cfg="field">
            ${['Severity', 'Category', 'Priority', 'Region', 'Status'].map(f => `<option value="${f}" ${cfg.field === f ? 'selected' : ''}>${f}</option>`).join('')}
          </select>
        </div>`;
        }
        return html;
    }

    function buildAIFields(type, cfg) {
        return `
      <div class="field-group">
        <label class="field-label">Input Source</label>
        <select class="field-select" data-cfg="inputSource">
          ${['Incident Record', 'Observation Data', 'PTW Form', 'Audit Report', 'Sensor Feed'].map(s => `<option value="${s}" ${cfg.inputSource === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">Confidence Threshold</label>
        <div class="field-slider-wrap">
          <input type="range" class="field-slider" min="50" max="99" value="${cfg.confidence || 80}" data-cfg="confidence" />
          <span class="field-slider-val">${cfg.confidence || 80}%</span>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Output Mapping</label>
        <select class="field-select" data-cfg="outputMap">
          ${['Risk Score', 'Severity Label', 'Decision Flag', 'Recommendation Text', 'Category Tags'].map(o => `<option value="${o}" ${cfg.outputMap === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">Fail-Safe Behavior</label>
        <select class="field-select" data-cfg="failSafe">
          ${['Escalate to Human', 'Skip Step', 'Raise Alert', 'Use Default Value'].map(f => `<option value="${f}" ${cfg.failSafe === f ? 'selected' : ''}>${f}</option>`).join('')}
        </select>
      </div>`;
    }

    function buildApprovalFields(type, cfg) {
        let html = `
      <div class="field-group">
        <label class="field-label">Approver Role</label>
        <select class="field-select" data-cfg="role">
          ${['HSE Manager', 'Area Manager', 'Corporate HSE Director', 'Regional Director', 'Safety Committee'].map(r => `<option value="${r}" ${cfg.role === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">SLA Timer (hours)</label>
        <input type="number" class="field-input" data-cfg="slaHours" value="${cfg.slaHours || 24}" min="1" max="720" />
      </div>
      <div class="field-group">
        <label class="field-label">On SLA Breach</label>
        <select class="field-select" data-cfg="slaAction">
          ${['Auto-Escalate', 'Send Reminder', 'Skip Approval', 'Reject Request'].map(a => `<option value="${a}" ${cfg.slaAction === a ? 'selected' : ''}>${a}</option>`).join('')}
        </select>
      </div>`;
        if (type === 'multi_level_approval') {
            html += `
        <div class="field-group">
          <label class="field-label">Approval Levels</label>
          <input type="number" class="field-input" data-cfg="levels" value="${cfg.levels || 2}" min="2" max="5" />
        </div>`;
        }
        return html;
    }

    function bindFieldEvents(node, def) {
        const content = document.getElementById('config-panel-content');
        if (!content) return;

        // Standard selects/inputs
        content.querySelectorAll('[data-cfg]').forEach(el => {
            const key = el.dataset.cfg;
            el.addEventListener('change', () => updateCfg(node, key, el.value));
            if (el.type === 'range') {
                el.addEventListener('input', () => {
                    const val = el.dataset.cfg === 'confidence' ? el.value + '%' : el.value;
                    const span = el.parentElement.querySelector('.field-slider-val');
                    if (span) span.textContent = val;
                    updateCfg(node, key, parseInt(el.value));
                });
            }
            if (el.tagName === 'INPUT' && el.type !== 'range') {
                el.addEventListener('input', () => updateCfg(node, key, el.value));
            }
            if (el.tagName === 'TEXTAREA') {
                el.addEventListener('input', () => updateCfg(node, key, el.value));
            }
        });

        // Channel chips
        content.querySelectorAll('.channel-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                const selected = [...content.querySelectorAll('.channel-chip.active')].map(c => c.dataset.channel).join(',');
                updateCfg(node, 'channel', selected);
            });
        });

        // Conditions
        const addCondBtn = content.querySelector('#add-condition-btn');
        if (addCondBtn) {
            addCondBtn.addEventListener('click', () => {
                const conditions = node.config.conditions || [];
                conditions.push({ field: 'Risk Score', operator: '>', value: '' });
                updateCfg(node, 'conditions', conditions);
                show(node); // Re-render
            });
            content.querySelectorAll('.condition-remove-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const conditions = node.config.conditions || [];
                    conditions.splice(parseInt(btn.dataset.idx), 1);
                    updateCfg(node, 'conditions', conditions);
                    show(node);
                });
            });
            // Condition field changes
            content.querySelectorAll('[data-cfg-arr]').forEach(el => {
                el.addEventListener('change', () => {
                    const conditions = JSON.parse(JSON.stringify(node.config.conditions || []));
                    const match = el.dataset.cfgArr.match(/conditions\[(\d+)\]\.(\w+)/);
                    if (match) { conditions[parseInt(match[1])][match[2]] = el.value; updateCfg(node, 'conditions', conditions); }
                });
                el.addEventListener('input', () => {
                    const conditions = JSON.parse(JSON.stringify(node.config.conditions || []));
                    const match = el.dataset.cfgArr.match(/conditions\[(\d+)\]\.(\w+)/);
                    if (match) { conditions[parseInt(match[1])][match[2]] = el.value; updateCfg(node, 'conditions', conditions); }
                });
            });
        }
    }

    function updateCfg(node, key, value) {
        if (!node.config) node.config = {};
        node.config[key] = value;
        CanvasController.updateNodeConfig(node.id, node.config);
    }

    function clear() {
        const content = document.getElementById('config-panel-content');
        content.innerHTML = `<div class="config-empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
      <p>Click a node to configure it</p>
    </div>`;
        document.getElementById('right-panel-title').textContent = 'Properties';
    }

    function getCatColor(cat) {
        const map = {
            trigger: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
            action: { bg: 'rgba(100,116,139,0.15)', color: '#93c5fd' },
            logic: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
            ai: { bg: 'rgba(0,209,160,0.15)', color: '#00d1a0' },
            approval: { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
        };
        return map[cat] || map['action'];
    }

    function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    return { show, clear };
})();
