import { z } from "zod";
import { validateDomain, socrataGet, socrataPut, normalizeToCommaSeparated, formatResponse } from "../utils/socrata-utils.js";
// =============================================================================
// USER AND TEAM MANAGEMENT TOOLS  
// Tools focused on managing users, teams, and their roles within Socrata domains
// =============================================================================
/**
 * Search and discover users within a Socrata domain
 * Workflow: Find users for collaboration, permission management, or audit purposes
 */
export const userSearchTool = {
    name: "socrata_search_users",
    description: "Find users within a Socrata domain by various criteria. Use this to discover collaborators, check user status, or prepare for permission assignments.",
    inputSchema: {
        domain: z.string().describe('Socrata domain to search (e.g., "data.cityofchicago.org")'),
        ids: z.union([z.array(z.string()), z.string()]).optional().describe('Specific user IDs to look up (array or comma-separated)'),
        emails: z.union([z.array(z.string()), z.string()]).optional().describe('Email addresses to search for (array or comma-separated)'),
        roles: z.union([z.array(z.string()), z.string()]).optional().describe('Filter by user roles (e.g., ["admin", "editor", "viewer"])'),
        disabled: z.boolean().optional().describe('Filter by account status - true for disabled users, false for active'),
        future: z.boolean().optional().describe('Include future/pending users in results'),
        limit: z.number().min(1).max(1000).default(100).describe('Maximum results to return (1-1000)'),
        offset: z.number().min(0).default(0).describe('Offset for pagination through results'),
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
        const { domain, ids, emails, roles, disabled, future, limit, offset, format, detail } = args;
        try {
            validateDomain(domain);
            const url = new URL(`https://${domain}/api/catalog/v1/users`);
            url.searchParams.append('domain', domain);
            // Add query parameters
            const idsParam = normalizeToCommaSeparated(ids);
            if (idsParam)
                url.searchParams.append('ids', idsParam);
            const emailsParam = normalizeToCommaSeparated(emails);
            if (emailsParam)
                url.searchParams.append('emails', emailsParam);
            const rolesParam = normalizeToCommaSeparated(roles);
            if (rolesParam)
                url.searchParams.append('roles', rolesParam);
            if (disabled !== undefined)
                url.searchParams.append('disabled', disabled ? 't' : 'f');
            if (future !== undefined)
                url.searchParams.append('future', future ? 't' : 'f');
            url.searchParams.append('limit', limit.toString());
            url.searchParams.append('offset', offset.toString());
            const users = await socrataGet(url.toString());
            const formatted = formatResponse(users, { format, detail });
            return {
                content: [
                    {
                        type: "text",
                        text: format === 'markdown'
                            ? `# User Search Results\n\n**Domain:** ${domain}\n**Users Found:** ${Array.isArray(users) ? users.length : 'Unknown'}\n**Page:** ${Math.floor(offset / limit) + 1}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                            : JSON.stringify(formatted, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            throw new Error(`Failed to search users on ${domain}: ${error instanceof Error ? error.message : String(error)}. Try adjusting your search criteria or checking domain access permissions.`);
        }
    }
};
/**
 * Search and discover teams within a Socrata domain
 * Workflow: Find teams for collaboration or organizational understanding
 */
export const teamSearchTool = {
    name: "socrata_search_teams",
    description: "Find teams within a Socrata domain by ID or name. Use this to discover organizational structure or find teams for collaboration.",
    inputSchema: {
        domain: z.string().describe('Socrata domain to search (e.g., "data.cityofchicago.org")'),
        ids: z.union([z.array(z.string()), z.string()]).optional().describe('Specific team IDs to look up'),
        names: z.union([z.array(z.string()), z.string()]).optional().describe('Team names to search for (partial matches supported)'),
        limit: z.number().min(1).max(1000).default(100).describe('Maximum results to return'),
        offset: z.number().min(0).default(0).describe('Offset for pagination'),
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
        const { domain, ids, names, limit, offset, format, detail } = args;
        try {
            validateDomain(domain);
            const url = new URL(`https://${domain}/api/catalog/v1/teams`);
            url.searchParams.append('domain', domain);
            const idsParam = normalizeToCommaSeparated(ids);
            if (idsParam)
                url.searchParams.append('ids', idsParam);
            const namesParam = normalizeToCommaSeparated(names);
            if (namesParam)
                url.searchParams.append('names', namesParam);
            url.searchParams.append('limit', limit.toString());
            url.searchParams.append('offset', offset.toString());
            const teams = await socrataGet(url.toString());
            const formatted = formatResponse(teams, { format, detail });
            return {
                content: [
                    {
                        type: "text",
                        text: format === 'markdown'
                            ? `# Team Search Results\n\n**Domain:** ${domain}\n**Teams Found:** ${Array.isArray(teams) ? teams.length : 'Unknown'}\n**Page:** ${Math.floor(offset / limit) + 1}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                            : JSON.stringify(formatted, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            throw new Error(`Failed to search teams on ${domain}: ${error instanceof Error ? error.message : String(error)}. Try adjusting your search criteria or checking domain access permissions.`);
        }
    }
};
/**
 * Get roles assigned to a specific user
 * Workflow: Check user permissions before making changes or understanding access levels
 */
export const userRolesGetTool = {
    name: "socrata_get_user_roles",
    description: "Check what roles and permissions a user has within a Socrata domain. Use this before modifying permissions or understanding user capabilities.",
    inputSchema: {
        domain: z.string().describe('Socrata domain (e.g., "data.cityofchicago.org")'),
        userId: z.string().describe('User ID to check roles for'),
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
        const { domain, userId, format, detail } = args;
        try {
            validateDomain(domain);
            const url = `https://${domain}/api/catalog/v1/users/${userId}/roles`;
            const roles = await socrataGet(url);
            const formatted = formatResponse(roles, { format, detail });
            return {
                content: [
                    {
                        type: "text",
                        text: format === 'markdown'
                            ? `# User Roles\n\n**Domain:** ${domain}\n**User ID:** ${userId}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                            : JSON.stringify(formatted, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            throw new Error(`Failed to get roles for user ${userId} on ${domain}: ${error instanceof Error ? error.message : String(error)}. Check if the user exists and you have permission to view their roles.`);
        }
    }
};
/**
 * Update roles for a specific user
 * Workflow: Modify user permissions after checking current state
 */
export const userRolesUpdateTool = {
    name: "socrata_update_user_roles",
    description: "Modify the roles assigned to a user within a Socrata domain. Use this to grant or revoke permissions. Consider checking current roles first.",
    inputSchema: {
        domain: z.string().describe('Socrata domain (e.g., "data.cityofchicago.org")'),
        userId: z.string().describe('User ID to update roles for'),
        roles: z.array(z.string()).describe('Complete list of role names to assign (e.g., ["admin", "editor", "viewer"])'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format')
    },
    annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
    },
    handler: async (args, extra) => {
        const { domain, userId, roles, format } = args;
        try {
            validateDomain(domain);
            const url = `https://${domain}/api/catalog/v1/users/${userId}/roles`;
            const result = await socrataPut(url, { roles });
            const formatted = formatResponse(result, { format });
            return {
                content: [
                    {
                        type: "text",
                        text: format === 'markdown'
                            ? `# User Roles Updated\n\n**Domain:** ${domain}\n**User ID:** ${userId}\n**New Roles:** ${roles.join(', ')}\n**Status:** Success\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                            : JSON.stringify(formatted, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            throw new Error(`Failed to update roles for user ${userId} on ${domain}: ${error instanceof Error ? error.message : String(error)}. Check if you have admin permissions and the roles are valid for this domain.`);
        }
    }
};
// Helper functions for user management
export async function getUserRoles(domain, userId) {
    validateDomain(domain);
    const url = `https://${domain}/api/catalog/v1/users/${userId}/roles`;
    return await socrataGet(url);
}
export async function updateUserRoles(domain, userId, roles) {
    validateDomain(domain);
    const url = `https://${domain}/api/catalog/v1/users/${userId}/roles`;
    return await socrataPut(url, { roles });
}
//# sourceMappingURL=user-tools.js.map