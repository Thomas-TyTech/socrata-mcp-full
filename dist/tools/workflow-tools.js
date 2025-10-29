import { z } from "zod";
import { validateDomain, socrataGet, socrataPut, formatResponse } from "../utils/socrata-utils.js";
// =============================================================================
// WORKFLOW MANAGEMENT TOOLS
// Tools focused on managing workflow contexts, automation, and process coordination
// =============================================================================
/**
 * Get workflow context and configuration information
 * Workflow: Understand current workflow state before making modifications
 */
export const workflowContextGetTool = {
    name: "socrata_get_workflow_context",
    description: "Retrieve workflow context and configuration information for Socrata automation processes. Use this to understand current workflow state before making changes.",
    inputSchema: {
        domain: z.string().describe('Socrata domain (e.g., "data.cityofchicago.org")'),
        workflowId: z.string().describe('Workflow identifier to get context for'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
        detail: z.enum(['concise', 'detailed']).default('detailed').describe('Level of detail in response')
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
    },
    handler: async (args, extra) => {
        const { domain, workflowId, format, detail } = args;
        try {
            validateDomain(domain);
            const context = await getWorkflowContext(domain, workflowId);
            const formatted = formatResponse(context, { format, detail });
            return {
                content: [
                    {
                        type: "text",
                        text: format === 'markdown'
                            ? `# Workflow Context\n\n**Domain:** ${domain}\n**Workflow ID:** ${workflowId}\n**Status:** ${context.status || 'Unknown'}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                            : JSON.stringify(formatted, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            throw new Error(`Failed to get workflow context for ${workflowId} on ${domain}: ${error instanceof Error ? error.message : String(error)}. Check if the workflow ID is correct and you have permission to access workflow information.`);
        }
    }
};
/**
 * Update workflow context and configuration
 * Workflow: Modify workflow settings after reviewing current context
 */
export const workflowContextUpdateTool = {
    name: "socrata_update_workflow_context",
    description: "Update workflow context and configuration for Socrata automation processes. Use this to modify workflow behavior, parameters, or state after checking current context.",
    inputSchema: {
        domain: z.string().describe('Socrata domain (e.g., "data.cityofchicago.org")'),
        workflowId: z.string().describe('Workflow identifier to update context for'),
        context: z.record(z.any()).describe('Context data to update - JSON object with workflow configuration parameters'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format')
    },
    annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
    },
    handler: async (args, extra) => {
        const { domain, workflowId, context, format } = args;
        try {
            validateDomain(domain);
            const result = await updateWorkflowContext(domain, workflowId, context);
            const formatted = formatResponse(result, { format });
            return {
                content: [
                    {
                        type: "text",
                        text: format === 'markdown'
                            ? `# Workflow Context Updated\n\n**Domain:** ${domain}\n**Workflow ID:** ${workflowId}\n**Status:** Success\n**Updated Fields:** ${Object.keys(context).join(', ')}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                            : JSON.stringify(formatted, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            throw new Error(`Failed to update workflow context for ${workflowId} on ${domain}: ${error instanceof Error ? error.message : String(error)}. Check if you have permission to modify workflows and the context data is valid.`);
        }
    }
};
// Helper functions for workflow management
export async function getWorkflowContext(domain, workflowId) {
    validateDomain(domain);
    const url = `https://${domain}/api/catalog/v1/workflows/${workflowId}/context`;
    return await socrataGet(url);
}
export async function updateWorkflowContext(domain, workflowId, context) {
    validateDomain(domain);
    const url = `https://${domain}/api/catalog/v1/workflows/${workflowId}/context`;
    return await socrataPut(url, context);
}
//# sourceMappingURL=workflow-tools.js.map