/* ======================================
   MAIN APP – Orchestrates all modules
   Routes between List and Builder views,
   handles auto-save, toast, publish, etc.
   ====================================== */

// ======= TOAST SYSTEM =======
const Toast = {
    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// ======= MODAL SYSTEM =======
const Modal = {
    show(title, body, onConfirm) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').textContent = body;
        document.getElementById('modal-overlay').classList.remove('hidden');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        const closeBtn = document.getElementById('modal-close-btn');
        const close = () => document.getElementById('modal-overlay').classList.add('hidden');
        confirmBtn.onclick = () => { onConfirm && onConfirm(); close(); };
        cancelBtn.onclick = close; closeBtn.onclick = close;
    }
};

// ======= APP STATE =======
const App = (() => {
    let currentWorkflow = null;
    let isDirty = false;
    let autoSaveTimer = null;
    let lastSavedAt = null;
    let currentFilter = 'all';

    function init() {
        DemoWorkflow.ensureDemo();
        renderListView();
        bindListEvents();
        bindBuilderEvents();
        startAutoSaveTimer();
        // Check if we should re-open last builder
        const lastId = WorkflowManager.getCurrentId();
        if (lastId) {
            const wf = WorkflowManager.getWorkflow(lastId);
            if (wf) openBuilder(wf);
        }
    }

    // ======= LIST VIEW =======
    function renderListView() {
        const all = WorkflowManager.getAllWorkflows();
        updateStats(all);

        const grid = document.getElementById('workflow-grid');
        const filtered = currentFilter === 'all' ? all : all.filter(w => w.status === currentFilter);

        if (!filtered.length) {
            grid.innerHTML = `<div class="workflow-empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3" stroke-dasharray="4 2"/><path d="M12 8v8M8 12h8"/></svg>
        <h3>No workflows ${currentFilter !== 'all' ? `with status "${currentFilter}"` : 'yet'}</h3>
        <p>Create a new workflow to get started</p>
      </div>`;
            return;
        }

        grid.innerHTML = filtered.map(wf => {
            const accentClass = wf.status === 'active' ? 'active-accent' : wf.status === 'archived' ? 'archived-accent' : '';
            const nodeCount = (wf.nodes || []).length;
            return `
        <div class="workflow-card" data-wf-id="${wf.id}">
          <div class="workflow-card-accent ${accentClass}"></div>
          <div class="workflow-card-body">
            <div class="workflow-card-header">
              <div class="workflow-card-title">${escHtml(wf.name)}</div>
              <span class="status-badge badge-${wf.status || 'draft'}">${wf.status || 'draft'}</span>
            </div>
            <div class="workflow-card-desc">${escHtml(wf.description || 'No description')}</div>
            <div class="workflow-card-meta">
              <div class="workflow-card-node-count">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
                ${nodeCount} node${nodeCount !== 1 ? 's' : ''}
              </div>
              <div class="workflow-card-time">${WorkflowManager.timeAgo(wf.updatedAt)}</div>
            </div>
            <div class="workflow-card-actions">
              <button class="btn btn-secondary btn-sm wf-open-btn" data-wf-id="${wf.id}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button class="btn btn-ghost btn-sm wf-dup-btn" data-wf-id="${wf.id}">Duplicate</button>
              <button class="btn btn-ghost btn-sm wf-del-btn" data-wf-id="${wf.id}" style="color:var(--error)">Delete</button>
            </div>
          </div>
        </div>
      `;
        }).join('');

        // Card click to open
        grid.querySelectorAll('.wf-open-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wf = WorkflowManager.getWorkflow(btn.dataset.wfId);
                if (wf) openBuilder(wf);
            });
        });
        grid.querySelectorAll('.workflow-card').forEach(card => {
            card.addEventListener('dblclick', () => {
                const wf = WorkflowManager.getWorkflow(card.dataset.wfId);
                if (wf) openBuilder(wf);
            });
        });
        grid.querySelectorAll('.wf-dup-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); duplicateWorkflow(btn.dataset.wfId); });
        });
        grid.querySelectorAll('.wf-del-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                Modal.show('Delete Workflow', 'Are you sure you want to delete this workflow? This cannot be undone.', () => {
                    WorkflowManager.deleteWorkflow(btn.dataset.wfId);
                    renderListView();
                    Toast.show('Workflow deleted', 'info');
                });
            });
        });
    }

    function updateStats(all) {
        document.getElementById('stat-total').textContent = all.length;
        document.getElementById('stat-active').textContent = all.filter(w => w.status === 'active').length;
        document.getElementById('stat-draft').textContent = all.filter(w => w.status === 'draft').length;
    }

    function duplicateWorkflow(id) {
        const wf = WorkflowManager.getWorkflow(id);
        if (!wf) return;
        const dup = JSON.parse(JSON.stringify(wf));
        dup.id = 'wf_' + Date.now();
        dup.name = wf.name + ' (Copy)';
        dup.status = 'draft';
        dup.createdAt = dup.updatedAt = new Date().toISOString();
        WorkflowManager.saveWorkflow(dup);
        renderListView();
        Toast.show('Workflow duplicated', 'success');
    }

    function bindListEvents() {
        document.getElementById('create-workflow-btn').addEventListener('click', () => {
            const wf = WorkflowManager.createNewWorkflow('New HSE Workflow');
            WorkflowManager.saveWorkflow(wf);
            openBuilder(wf);
        });

        document.getElementById('import-workflow-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        document.getElementById('import-file-input').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const wf = await WorkflowManager.importJSON(file);
                WorkflowManager.saveWorkflow(wf);
                renderListView();
                Toast.show('Workflow imported successfully', 'success');
            } catch (err) {
                Toast.show('Import failed: Invalid JSON', 'error');
            }
            e.target.value = '';
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderListView();
            });
        });
    }

    // ======= BUILDER VIEW =======
    function openBuilder(workflow) {
        currentWorkflow = JSON.parse(JSON.stringify(workflow));
        isDirty = false;
        window._publishedLocked = false;

        // Switch views
        document.getElementById('workflow-list-view').classList.remove('active');
        document.getElementById('builder-view').classList.add('active');
        WorkflowManager.setCurrentId(currentWorkflow.id);

        // Init UI
        document.getElementById('workflow-name-input').value = currentWorkflow.name || 'Untitled';
        updateStatusBadge(currentWorkflow.status || 'draft');
        updateVersionStamp();

        // Published lock
        if (currentWorkflow.status === 'active') {
            window._publishedLocked = true;
            document.getElementById('published-banner').classList.remove('hidden');
        } else {
            document.getElementById('published-banner').classList.add('hidden');
        }

        // Init component library
        NodeDefs.renderComponentLibrary();
        document.getElementById('component-search').addEventListener('input', (e) => {
            NodeDefs.renderComponentLibrary(e.target.value);
        });

        // Init canvas
        CanvasController.init(currentWorkflow.nodes || [], currentWorkflow.connections || []);

        // Auto-fit if demo
        if (currentWorkflow.nodes && currentWorkflow.nodes.length > 0) {
            setTimeout(() => CanvasController.fitView(), 100);
        }

        Validation.clearErrors();
        ConfigPanel.clear();

        // Close preview if open
        if (PreviewMode.isActive()) PreviewMode.deactivate();
    }

    function closeBuilder() {
        if (isDirty) {
            saveCurrentWorkflow(false);
        }
        if (PreviewMode.isActive()) PreviewMode.deactivate();
        WorkflowManager.setCurrentId(null);
        currentWorkflow = null;
        window._publishedLocked = false;
        document.getElementById('builder-view').classList.remove('active');
        document.getElementById('workflow-list-view').classList.add('active');
        renderListView();
    }

    function bindBuilderEvents() {
        // Back button
        document.getElementById('back-to-list-btn').addEventListener('click', () => {
            if (isDirty) {
                Modal.show('Unsaved Changes', 'You have unsaved changes. Save before leaving?', () => {
                    saveCurrentWorkflow(true); closeBuilder();
                });
            } else { closeBuilder(); }
        });

        // Workflow name
        document.getElementById('workflow-name-input').addEventListener('input', (e) => {
            if (currentWorkflow) { currentWorkflow.name = e.target.value; markDirty(); }
        });
        document.getElementById('workflow-name-input').addEventListener('blur', () => saveCurrentWorkflow(false));

        // Save
        document.getElementById('save-btn').addEventListener('click', () => saveCurrentWorkflow(true));

        // Export
        document.getElementById('export-btn').addEventListener('click', () => {
            if (!currentWorkflow) return;
            syncWorkflowData();
            WorkflowManager.exportJSON(currentWorkflow);
            Toast.show('Workflow exported as JSON', 'success');
        });

        // Preview
        document.getElementById('preview-btn').addEventListener('click', () => {
            if (PreviewMode.isActive()) { PreviewMode.deactivate(); }
            else { PreviewMode.activate(); }
        });

        // Close log
        document.getElementById('close-log-btn').addEventListener('click', () => PreviewMode.deactivate());

        // Run simulation
        document.getElementById('run-simulation-btn').addEventListener('click', () => PreviewMode.runSimulation());

        // Publish
        document.getElementById('publish-btn').addEventListener('click', handlePublish);

        // Unpublish
        document.getElementById('unpublish-btn').addEventListener('click', () => {
            if (!currentWorkflow) return;
            currentWorkflow.status = 'draft';
            window._publishedLocked = false;
            document.getElementById('published-banner').classList.add('hidden');
            updateStatusBadge('draft');
            CanvasController.render();
            saveCurrentWorkflow(false);
            Toast.show('Reverted to Draft', 'info');
        });

        // Left panel collapse
        document.getElementById('collapse-left-btn').addEventListener('click', () => {
            document.getElementById('left-panel').style.width = '0';
            document.getElementById('left-panel-tab').classList.remove('hidden');
            document.getElementById('left-panel').classList.add('collapsed');
        });
        document.getElementById('expand-left-btn').addEventListener('click', () => {
            document.getElementById('left-panel').style.width = '240px';
            document.getElementById('left-panel-tab').classList.add('hidden');
            document.getElementById('left-panel').classList.remove('collapsed');
        });

        // Right panel close
        document.getElementById('close-right-panel-btn').addEventListener('click', () => {
            CanvasController.selectNode(null);
        });

        // Zoom buttons already bound in canvas.js
    }

    function handlePublish() {
        if (!currentWorkflow) return;
        syncWorkflowData();
        const errors = Validation.validate(currentWorkflow.nodes, currentWorkflow.connections || []);
        if (errors.length) {
            Validation.showErrors(errors);
            Toast.show(`${errors.length} validation error(s) found`, 'error', 4000);
            return;
        }
        Validation.clearErrors();
        Modal.show('Publish Workflow', `Publish "${currentWorkflow.name}"? The workflow will be marked as Active and locked for editing.`, () => {
            currentWorkflow.status = 'active';
            window._publishedLocked = true;
            document.getElementById('published-banner').classList.remove('hidden');
            updateStatusBadge('active');
            CanvasController.render();
            saveCurrentWorkflow(false);
            Toast.show('Workflow published successfully! 🚀', 'success', 4000);
        });
    }

    function markDirty() {
        isDirty = true;
        const indicator = document.getElementById('autosave-indicator');
        indicator.classList.add('saving');
        document.getElementById('autosave-text').textContent = 'Unsaved changes...';
    }

    function saveCurrentWorkflow(showToast) {
        if (!currentWorkflow) return;
        syncWorkflowData();
        isDirty = false;
        lastSavedAt = new Date();
        WorkflowManager.saveWorkflow(currentWorkflow);
        updateVersionStamp();
        const indicator = document.getElementById('autosave-indicator');
        indicator.classList.remove('saving');
        document.getElementById('autosave-text').textContent = 'Auto-saved';
        if (showToast) Toast.show('Workflow saved', 'success');
    }

    function syncWorkflowData() {
        if (!currentWorkflow) return;
        currentWorkflow.nodes = CanvasController.getNodes();
        currentWorkflow.connections = Connections.getConnections();
        currentWorkflow.name = document.getElementById('workflow-name-input').value || 'Untitled';
    }

    function updateStatusBadge(status) {
        const badge = document.getElementById('workflow-status-badge');
        badge.className = `status-badge badge-${status}`;
        badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }

    function updateVersionStamp() {
        const now = new Date();
        document.getElementById('version-stamp').textContent = `v${currentWorkflow ? currentWorkflow.version : '1.0'} · ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    function startAutoSaveTimer() {
        setInterval(() => {
            if (isDirty && currentWorkflow) {
                saveCurrentWorkflow(false);
                Toast.show('Workflow auto-saved', 'success', 2000);
            }
            // Always update autosave text
            if (!isDirty && lastSavedAt) {
                const diff = Math.floor((Date.now() - lastSavedAt) / 1000);
                const label = diff < 5 ? 'Saved just now' : diff < 60 ? `Saved ${diff}s ago` : `Saved ${Math.floor(diff / 60)}m ago`;
                document.getElementById('autosave-text').textContent = label;
            }
        }, 5000);
    }

    function escHtml(str) { return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    return { init, markDirty, openBuilder, closeBuilder, renderListView };
})();

// ======= BOOT =======
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
