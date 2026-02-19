/* ======================================
   DEMO WORKFLOWS – Preloaded Examples
   "Intelligent Incident Escalation"
   "Smart Observation Loop"
   "Automated Permit to Work (PTW)"
   ====================================== */

const DemoWorkflow = (() => {

    // 1. INCIDENT ESCALATION (Existing)
    function getIncidentDemo() {
        return {
            id: 'wf_demo_incident_escalation',
            name: 'Intelligent Incident Escalation',
            status: 'active',
            version: '1.2',
            description: 'AI-powered workflow that automatically analyzes incidents, evaluates risk, and escalates to corporate when risk exceeds threshold.',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
            nodes: [
                { id: 'node_trigger_01', type: 'incident_logged', name: 'Incident Logged', category: 'trigger', x: 80, y: 200, config: { description: 'Triggered when any HSE incident is logged in the system.' } },
                { id: 'node_ai_01', type: 'ai_risk_analyzer', name: 'AI Risk Analyzer', category: 'ai', x: 380, y: 200, config: { inputSource: 'Incident Record', confidence: 85, outputMap: 'Risk Score', failSafe: 'Escalate to Human' } },
                { id: 'node_if_01', type: 'if_else', name: 'Risk > 75?', category: 'logic', x: 680, y: 200, config: { conditions: [{ field: 'Risk Score', operator: '>', value: '75' }] } },
                { id: 'node_approval_01', type: 'multi_level_approval', name: 'Multi-Level Approval', category: 'approval', x: 980, y: 130, config: { role: 'HSE Manager', slaHours: 4, slaAction: 'Auto-Escalate', levels: 2 } },
                { id: 'node_escalate_01', type: 'escalate_role', name: 'Escalate to Corporate', category: 'action', x: 1280, y: 130, config: { role: 'Corporate HSE Director', reason: 'High-risk incident identified by AI Risk Analyzer.' } },
                { id: 'node_notify_low', type: 'send_notification', name: 'Notify Site Manager', category: 'action', x: 980, y: 310, config: { recipient: 'Area Manager', message: 'Low-risk incident logged. Review at earliest convenience.', channel: 'Email,In-App' } }
            ],
            connections: [
                { id: 'conn_d_01', from: 'node_trigger_01', fromHandle: 'default', to: 'node_ai_01', toHandle: 'input' },
                { id: 'conn_d_02', from: 'node_ai_01', fromHandle: 'default', to: 'node_if_01', toHandle: 'input' },
                { id: 'conn_d_03', from: 'node_if_01', fromHandle: 'branch-if', to: 'node_approval_01', toHandle: 'input' },
                { id: 'conn_d_04', from: 'node_approval_01', fromHandle: 'default', to: 'node_escalate_01', toHandle: 'input' },
                { id: 'conn_d_05', from: 'node_if_01', fromHandle: 'branch-else', to: 'node_notify_low', toHandle: 'input' }
            ]
        };
    }

    // 2. OBSERVATION LOOP
    function getObservationDemo() {
        return {
            id: 'wf_demo_observation_loop',
            name: 'Smart Observation Loop',
            status: 'draft',
            version: '1.0',
            description: 'Automatically categorize observations, check for hazards using AI, and assign rectification tasks if needed.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodes: [
                { id: 'obs_trig_01', type: 'observation_raised', name: 'Observation Raised', category: 'trigger', x: 60, y: 220, config: {} },
                { id: 'obs_ai_01', type: 'ai_root_cause', name: 'AI Hazard Classifier', category: 'ai', x: 340, y: 220, config: { inputSource: 'Observation Text/Image', confidence: 80, outputMap: 'Hazard Type' } },
                { id: 'obs_if_01', type: 'if_else', name: 'Is Hazardous?', category: 'logic', x: 620, y: 220, config: { conditions: [{ field: 'Hazard Type', operator: '!=', value: 'Safe' }] } },
                { id: 'obs_act_01', type: 'assign_task', name: 'Assign Rectification', category: 'action', x: 900, y: 140, config: { role: 'Maintenance Team', priority: 'High', description: 'Rectify hazard identified by AI.' } },
                { id: 'obs_act_02', type: 'update_status', name: 'Mark as Closed', category: 'action', x: 900, y: 320, config: { status: 'Closed', comment: 'Auto-closed: No hazard detected.' } },
                { id: 'obs_notify_01', type: 'send_notification', name: 'Notify Reporter', category: 'action', x: 1180, y: 320, config: { recipient: 'Reporter', message: 'Your observation was safe and has been closed.', channel: 'In-App' } }
            ],
            connections: [
                { id: 'c_obs_01', from: 'obs_trig_01', fromHandle: 'default', to: 'obs_ai_01', toHandle: 'input' },
                { id: 'c_obs_02', from: 'obs_ai_01', fromHandle: 'default', to: 'obs_if_01', toHandle: 'input' },
                { id: 'c_obs_03', from: 'obs_if_01', fromHandle: 'branch-if', to: 'obs_act_01', toHandle: 'input' },
                { id: 'c_obs_04', from: 'obs_if_01', fromHandle: 'branch-else', to: 'obs_act_02', toHandle: 'input' },
                { id: 'c_obs_05', from: 'obs_act_02', fromHandle: 'default', to: 'obs_notify_01', toHandle: 'input' }
            ]
        };
    }

    // 3. PERMIT TO WORK (PTW)
    function getPTWDemo() {
        return {
            id: 'wf_demo_ptw_automated',
            name: 'Automated Permit to Work (PTW)',
            status: 'draft',
            version: '0.9',
            description: 'Streamline permit issuance by pre-validating documents with AI before routing for Site Manager approval.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodes: [
                { id: 'ptw_trig_01', type: 'form_submission', name: 'PTW Request', category: 'trigger', x: 60, y: 180, config: { formType: 'Hot Work Permit' } },
                { id: 'ptw_ai_01', type: 'ai_compliance_checker', name: 'AI Doc Validator', category: 'ai', x: 340, y: 180, config: { inputSource: 'Attached Certs', ruleSet: 'HSE Global Standards', confidence: 90 } },
                { id: 'ptw_if_01', type: 'if_else', name: 'Docs Valid?', category: 'logic', x: 620, y: 180, config: { conditions: [{ field: 'Validation Score', operator: '>', value: '95' }] } },
                { id: 'ptw_app_01', type: 'single_approver', name: 'Site Manager Approval', category: 'approval', x: 920, y: 100, config: { role: 'Site Manager', slaHours: 2 } },
                { id: 'ptw_iss_01', type: 'create_ptw', name: 'Issue Permit', category: 'action', x: 1220, y: 100, config: { type: 'Hot Work', validFor: '8h' } },
                { id: 'ptw_rej_01', type: 'send_notification', name: 'Reject Request', category: 'action', x: 920, y: 300, config: { recipient: 'Applicant', message: 'PTW Rejected: Documentation invalid.', channel: 'Email' } }
            ],
            connections: [
                { id: 'c_ptw_01', from: 'ptw_trig_01', fromHandle: 'default', to: 'ptw_ai_01', toHandle: 'input' },
                { id: 'c_ptw_02', from: 'ptw_ai_01', fromHandle: 'default', to: 'ptw_if_01', toHandle: 'input' },
                { id: 'c_ptw_03', from: 'ptw_if_01', fromHandle: 'branch-if', to: 'ptw_app_01', toHandle: 'input' },
                { id: 'c_ptw_04', from: 'ptw_app_01', fromHandle: 'default', to: 'ptw_iss_01', toHandle: 'input' },
                { id: 'c_ptw_05', from: 'ptw_if_01', fromHandle: 'branch-else', to: 'ptw_rej_01', toHandle: 'input' }
            ]
        };
    }

    function ensureDemo() {
        const all = WorkflowManager.getAllWorkflows();
        const demos = [getIncidentDemo(), getObservationDemo(), getPTWDemo()];

        // Add each demo if it doesn't exist
        demos.forEach(demo => {
            if (!all.find(w => w.id === demo.id)) {
                WorkflowManager.saveWorkflow(demo);
            }
        });
    }

    return { getIncidentDemo, getObservationDemo, getPTWDemo, ensureDemo };
})();
