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

    // 4. CONFIGURABLE SAFETY INSPECTION
    function getInspectionDemo() {
        return {
            id: 'wf_demo_configurable_inspection',
            name: 'Configurable Safety Inspection with Risk Scoring',
            status: 'active',
            version: '2.0',
            description: 'Demonstrate how an Admin can create configurable inspection forms with risk scoring that drives automated routing logic.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodes: [
                {
                    id: 'insp_trig_01', type: 'inspection_form_builder', name: 'Inspection Form Builder', category: 'trigger', x: 60, y: 150, config: {
                        questions: [
                            { text: 'Is proper PPE being worn?', options: [{ text: 'Yes', score: 0 }, { text: 'Partially', score: 5 }, { text: 'No', score: 10 }] },
                            { text: 'Is housekeeping satisfactory?', options: [{ text: 'Good', score: 0 }, { text: 'Average', score: 3 }, { text: 'Poor', score: 8 }] },
                            { text: 'Are fire extinguishers accessible?', options: [{ text: 'Accessible', score: 0 }, { text: 'Blocked', score: 7 }] }
                        ]
                    }
                },
                { id: 'insp_calc_01', type: 'calculate_inspection_score', name: 'Calculate Inspection Score', category: 'action', x: 380, y: 150, config: { thresholdLow: 10, thresholdMedium: 20 } },

                { id: 'insp_if_high', type: 'if_else', name: 'Total Score > 20?', category: 'logic', x: 700, y: 150, config: { conditions: [{ field: 'Total Score', operator: '>', value: '20' }] } },

                // HIGH RISK BRANCH
                { id: 'insp_act_high_1', type: 'assign_task', name: 'Assign: HSE Manager', category: 'action', x: 1000, y: -20, config: { role: 'HSE Manager', taskTitle: 'Critical Inspection Failure' } },
                { id: 'insp_act_high_2', type: 'send_notification', name: 'Notify Project Director', category: 'action', x: 1300, y: -20, config: { recipient: 'Project Director', message: 'High Risk Hazard identified.' } },
                { id: 'insp_act_high_3', type: 'sla_escalation', name: 'SLA Escalation (24h)', category: 'approval', x: 1600, y: -20, config: { slaHours: 24, escalateTo: 'Corporate HSE Director' } },

                // MEDIUM RISK (IF FALSE -> CHECK IF > 10)
                { id: 'insp_if_med', type: 'if_else', name: 'Total Score > 10?', category: 'logic', x: 1000, y: 150, config: { conditions: [{ field: 'Total Score', operator: '>', value: '10' }] } },

                // MEDIUM RISK BRANCH
                { id: 'insp_act_med_1', type: 'assign_task', name: 'Assign to Contractor Supervisor', category: 'action', x: 1300, y: 150, config: { role: 'Contractor Supervisor' } },
                { id: 'insp_act_med_2', type: 'send_notification', name: 'Notify Area Supervisor', category: 'action', x: 1600, y: 150, config: { recipient: 'Area Supervisor', message: 'Medium risk findings from inspection.' } },

                // LOW RISK BRANCH
                { id: 'insp_act_low_1', type: 'update_status', name: 'Auto Close', category: 'action', x: 1300, y: 320, config: { status: 'Closed' } },
            ],
            connections: [
                { id: 'c_insp_01', from: 'insp_trig_01', fromHandle: 'default', to: 'insp_calc_01', toHandle: 'input' },
                { id: 'c_insp_02', from: 'insp_calc_01', fromHandle: 'default', to: 'insp_if_high', toHandle: 'input' },

                // High Risk Routing
                { id: 'c_insp_03', from: 'insp_if_high', fromHandle: 'branch-if', to: 'insp_act_high_1', toHandle: 'input' },
                { id: 'c_insp_04', from: 'insp_act_high_1', fromHandle: 'default', to: 'insp_act_high_2', toHandle: 'input' },
                { id: 'c_insp_05', from: 'insp_act_high_2', fromHandle: 'default', to: 'insp_act_high_3', toHandle: 'input' },

                // Medium / Low Logic Check
                { id: 'c_insp_06', from: 'insp_if_high', fromHandle: 'branch-else', to: 'insp_if_med', toHandle: 'input' },

                // Medium
                { id: 'c_insp_07', from: 'insp_if_med', fromHandle: 'branch-if', to: 'insp_act_med_1', toHandle: 'input' },
                { id: 'c_insp_08', from: 'insp_act_med_1', fromHandle: 'default', to: 'insp_act_med_2', toHandle: 'input' },

                // Low
                { id: 'c_insp_12', from: 'insp_if_med', fromHandle: 'branch-else', to: 'insp_act_low_1', toHandle: 'input' }
            ]
        };
    }

    function ensureDemo() {
        const all = WorkflowManager.getAllWorkflows();
        const demos = [getInspectionDemo(), getIncidentDemo(), getObservationDemo(), getPTWDemo()];

        // Add each demo if it doesn't exist
        demos.forEach(demo => {
            if (!all.find(w => w.id === demo.id)) {
                WorkflowManager.saveWorkflow(demo);
            }
        });
    }

    return { getInspectionDemo, getIncidentDemo, getObservationDemo, getPTWDemo, ensureDemo };
})();
