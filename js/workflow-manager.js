/* ======================================
   WORKFLOW MANAGER – Save/Load/Import/Export
   LocalStorage persistence
   ====================================== */

const WorkflowManager = (() => {
  const STORAGE_KEY = 'hse_workflows';
  const CURRENT_KEY = 'hse_current_workflow';

  function getAllWorkflows() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  }

  function saveWorkflows(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function getWorkflow(id) {
    return getAllWorkflows().find(w => w.id === id) || null;
  }

  function saveWorkflow(workflow) {
    const list = getAllWorkflows();
    const idx = list.findIndex(w => w.id === workflow.id);
    workflow.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      list[idx] = workflow;
    } else {
      list.unshift(workflow);
    }
    saveWorkflows(list);
    return workflow;
  }

  function deleteWorkflow(id) {
    const list = getAllWorkflows().filter(w => w.id !== id);
    saveWorkflows(list);
  }

  function setCurrentId(id) {
    localStorage.setItem(CURRENT_KEY, id);
  }

  function getCurrentId() {
    return localStorage.getItem(CURRENT_KEY);
  }

  function createNewWorkflow(name = 'Untitled Workflow') {
    return {
      id: 'wf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name,
      status: 'draft',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      connections: [],
      description: 'New HSE workflow',
    };
  }

  function exportJSON(workflow) {
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (workflow.name || 'workflow').replace(/\s+/g, '_') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const wf = JSON.parse(e.target.result);
          if (!wf.id || !wf.nodes) throw new Error('Invalid workflow JSON');
          // Re-id to avoid collisions
          wf.id = 'wf_' + Date.now();
          wf.name = (wf.name || 'Imported') + ' (Imported)';
          wf.status = 'draft';
          wf.updatedAt = new Date().toISOString();
          resolve(wf);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function timeAgo(isoStr) {
    const diff = Date.now() - new Date(isoStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return d === 1 ? 'Yesterday' : `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'Just now';
  }

  return { getAllWorkflows, getWorkflow, saveWorkflow, deleteWorkflow, setCurrentId, getCurrentId, createNewWorkflow, exportJSON, importJSON, timeAgo };
})();
