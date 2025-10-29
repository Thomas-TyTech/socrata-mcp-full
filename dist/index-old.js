#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { validateDomain, socrataGet, normalizeToCommaSeparated, formatResponse } from "./utils/socrata-utils.js";
import { userPermissionSchema, getPermissions, updatePermissions, searchCatalog, getSchedule, formatScheduleResponse, getActivityLog, getUserRoles, updateUserRoles, getWorkflowContext, updateWorkflowContext, updateMetadata } from "./tools/complex-tools.js";
// Create the MCP server
const server = new McpServer({
    name: "socrata-mcp-server",
    version: "1.0.0"
});
// =============================================================================
// CATALOG TOOLS
// =============================================================================
server.registerTool("socrata_get_catalog", {
    description: "Get catalog for a given Socrata domain, optionally filtered by category and type",
    inputSchema: {
        domain: z.string().describe('Socrata domain to get catalog for (e.g., "data.cityofchicago.org")'),
        type: z.enum(['dataset', 'filter', 'file']).describe('Type of catalog to retrieve'),
        category: z.string().optional().describe('Optional category to filter results'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
        detail: z.enum(['concise', 'detailed']).default('detailed').describe('Level of detail in response')
    },
}, async (args, extra) => {
    const { domain, type, category, format, detail } = args;
    try {
        validateDomain(domain);
        let url = `https://${domain}/api/catalog/v1?domains=${domain}&only=${type}`;
        if (category) {
            url += `&categories=${encodeURIComponent(category)}`;
        }
        const response = await socrataGet(url);
        const formatted = formatResponse(response, { format, detail });
        return {
            content: [
                {
                    type: "text",
                    text: format === 'markdown'
                        ? `# Catalog Results\n\n**Domain:** ${domain}\n**Type:** ${type}\n**Category:** ${category || 'All'}\n**Results:** ${response.resultSetSize || 0}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                        : JSON.stringify(formatted, null, 2)
                }
            ]
        };
    }
    catch (error) {
        throw new Error(`Socrata catalog error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
server.registerTool("socrata_search_catalog", {
    description: "Advanced catalog search with multiple filters, sorting, and pagination for Socrata domains",
    inputSchema: {
        domain: z.string().describe('Socrata domain to search (e.g., "data.cityofchicago.org")'),
        q: z.string().optional().describe('Search query string'),
        categories: z.array(z.string()).optional().describe('Categories to filter by'),
        tags: z.array(z.string()).optional().describe('Tags to filter by'),
        attribution: z.string().optional().describe('Attribution filter'),
        provenance: z.string().optional().describe('Provenance filter'),
        visibility: z.enum(['open', 'private', 'internal']).optional().describe('Visibility filter'),
        order: z.enum(['relevance', 'name', 'createdAt', 'updatedAt', 'page_views_last_month']).default('relevance').describe('Sort order'),
        limit: z.number().min(1).max(100).default(20).describe('Number of results to return'),
        offset: z.number().min(0).default(0).describe('Offset for pagination'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
        detail: z.enum(['concise', 'detailed']).default('detailed').describe('Level of detail in response')
    },
}, async (args, extra) => {
    const { domain, q, categories, tags, attribution, provenance, visibility, order, limit, offset, format, detail } = args;
    try {
        validateDomain(domain);
        const url = new URL(`https://${domain}/api/catalog/v1`);
        // Add search parameters
        url.searchParams.append('domains', domain);
        if (q)
            url.searchParams.append('q', q);
        if (categories && categories.length > 0)
            url.searchParams.append('categories', categories.join(','));
        if (tags && tags.length > 0)
            url.searchParams.append('tags', tags.join(','));
        if (attribution)
            url.searchParams.append('attribution', attribution);
        if (provenance)
            url.searchParams.append('provenance', provenance);
        if (visibility)
            url.searchParams.append('visibility', visibility);
        url.searchParams.append('order', order);
        url.searchParams.append('limit', limit.toString());
        url.searchParams.append('offset', offset.toString());
        const response = await socrataGet(url.toString());
        const formatted = formatResponse(response, { format, detail });
        return {
            content: [
                {
                    type: "text",
                    text: format === 'markdown'
                        ? `# Catalog Search Results\n\n**Domain:** ${domain}\n**Query:** ${q || 'None'}\n**Results:** ${response.resultSetSize || 0}\n**Limit:** ${limit}\n**Offset:** ${offset}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                        : JSON.stringify(formatted, null, 2)
                }
            ]
        };
    }
    catch (error) {
        throw new Error(`Socrata catalog search error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// =============================================================================
// USER MANAGEMENT TOOLS
// =============================================================================
server.registerTool("socrata_search_users", {
    description: "Search for users on a Socrata domain with various filters including IDs, emails, roles, and status",
    inputSchema: {
        domain: z.string().describe('The Socrata domain (e.g., "data.cityofchicago.org")'),
        ids: z.union([z.array(z.string()), z.string()]).optional().describe('User IDs to filter by (array or comma-separated string)'),
        emails: z.union([z.array(z.string()), z.string()]).optional().describe('Email addresses to filter by (array or comma-separated string)'),
        roles: z.union([z.array(z.string()), z.string()]).optional().describe('User roles to filter by (array or comma-separated string, e.g., ["admin", "editor"] or "admin,editor")'),
        disabled: z.boolean().optional().describe('Filter by disabled status (true/false)'),
        future: z.boolean().optional().describe('Include future users (true/false)'),
        limit: z.number().min(1).max(1000).default(100).describe('Maximum number of results to return'),
        offset: z.number().min(0).default(0).describe('Number of results to skip for pagination'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
        detail: z.enum(['concise', 'detailed']).default('detailed').describe('Level of detail in response')
    },
}, async (args, extra) => {
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
                        ? `# User Search Results\n\n**Domain:** ${domain}\n**Users Found:** ${Array.isArray(users) ? users.length : 'Unknown'}\n**Limit:** ${limit}\n**Offset:** ${offset}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                        : JSON.stringify(formatted, null, 2)
                }
            ]
        };
    }
    catch (error) {
        throw new Error(`Socrata user search error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
server.registerTool("socrata_search_teams", {
    description: "Search for teams on a Socrata domain with various filters",
    inputSchema: {
        domain: z.string().describe('The Socrata domain (e.g., "data.cityofchicago.org")'),
        ids: z.union([z.array(z.string()), z.string()]).optional().describe('Team IDs to filter by'),
        names: z.union([z.array(z.string()), z.string()]).optional().describe('Team names to filter by'),
        limit: z.number().min(1).max(1000).default(100).describe('Maximum number of results to return'),
        offset: z.number().min(0).default(0).describe('Number of results to skip for pagination'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
        detail: z.enum(['concise', 'detailed']).default('detailed').describe('Level of detail in response')
    },
}, async (args, extra) => {
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
                        ? `# Team Search Results\n\n**Domain:** ${domain}\n**Teams Found:** ${Array.isArray(teams) ? teams.length : 'Unknown'}\n**Limit:** ${limit}\n**Offset:** ${offset}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                        : JSON.stringify(formatted, null, 2)
                }
            ]
        };
    }
    catch (error) {
        throw new Error(`Socrata team search error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// =============================================================================
// METADATA AND ASSET MANAGEMENT
// =============================================================================
server.registerTool("socrata_get_metadata", {
    description: "Get metadata for a specific Socrata asset by its 4x4 identifier",
    inputSchema: {
        domain: z.string().describe('The Socrata domain (e.g., "data.cityofchicago.org")'),
        assetId: z.string().describe('The asset ID (4x4 identifier, e.g., "xzkq-xp2w")'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
        detail: z.enum(['concise', 'detailed']).default('detailed').describe('Level of detail in response')
    },
}, async (args, extra) => {
    const { domain, assetId, format, detail } = args;
    try {
        validateDomain(domain);
        const url = `https://${domain}/api/views/${assetId}.json`;
        const metadata = await socrataGet(url);
        const formatted = formatResponse(metadata, { format, detail });
        return {
            content: [
                {
                    type: "text",
                    text: format === 'markdown'
                        ? `# Asset Metadata\n\n**Domain:** ${domain}\n**Asset ID:** ${assetId}\n**Name:** ${metadata.name || 'Unknown'}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                        : JSON.stringify(formatted, null, 2)
                }
            ]
        };
    }
    catch (error) {
        throw new Error(`Socrata metadata error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// =============================================================================
// PERMISSIONS TOOLS
// =============================================================================
server.registerTool("socrata_get_permissions", {
    description: "Get current permissions for a Socrata asset including scope and user access levels",
    inputSchema: {
        domain: z.string().describe('The Socrata domain (e.g., "data.cityofchicago.org")'),
        assetId: z.string().describe('The asset ID (4x4 identifier)'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
        detail: z.enum(['concise', 'detailed']).default('detailed').describe('Level of detail in response')
    },
}, async (args, extra) => {
    const { domain, assetId, format, detail } = args;
    try {
        const permissions = await getPermissions(domain, assetId);
        const formatted = formatResponse(permissions, { format, detail });
        return {
            content: [
                {
                    type: "text",
                    text: format === 'markdown'
                        ? `# Asset Permissions\n\n**Domain:** ${domain}\n**Asset ID:** ${assetId}\n**Scope:** ${permissions.scope || 'Unknown'}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                        : JSON.stringify(formatted, null, 2)
                }
            ]
        };
    }
    catch (error) {
        throw new Error(`Socrata permissions error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
server.registerTool("socrata_update_permissions", {
    description: "Update permissions for a Socrata asset. Always gets current permissions first, merges changes, then updates. Can modify scope and user access levels.",
    inputSchema: {
        domain: z.string().describe('The Socrata domain (e.g., "data.cityofchicago.org")'),
        assetId: z.string().describe('The asset ID (4x4 identifier)'),
        scope: z.enum(['private', 'public', 'site']).optional().describe('Scope: "private" (owner only), "public" (everyone), or "site" (internal users)'),
        users: z.array(userPermissionSchema).optional().describe('Array of users with their access levels'),
        replaceUsers: z.boolean().default(false).describe('If true, replace all users; if false, merge with existing users'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format')
    },
}, async (args, extra) => {
    const { domain, assetId, scope, users, replaceUsers, format } = args;
    try {
        const result = await updatePermissions(domain, assetId, { scope, users, replaceUsers });
        const formatted = formatResponse(result, { format });
        return {
            content: [
                {
                    type: "text",
                    text: format === 'markdown'
                        ? `# Permissions Updated\n\n**Domain:** ${domain}\n**Asset ID:** ${assetId}\n**Status:** Success\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                        : JSON.stringify(formatted, null, 2)
                }
            ]
        };
    }
    catch (error) {
        throw new Error(`Socrata permissions update error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// =============================================================================
// SCHEDULE TOOLS
// =============================================================================
server.registerTool("socrata_get_schedule", {
    description: "Get publishing schedule and cadence information for Socrata datasets. Returns structured schedule data including cadence, status, last run time, row counts, next run time, and owner information. Provide either FXF directly or asset name to auto-discover FXF.",
    inputSchema: {
        domain: z.string().describe('Domain to get schedule for (e.g., "data.cityofchicago.org")'),
        fxf: z.string().optional().describe('FXF identifier of the asset (4x4 format like "abcd-1234"). If provided, will get schedule directly.'),
        assetName: z.string().optional().describe('Name of the asset to search for in catalog. If multiple matches, will show options.'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
        detail: z.enum(['concise', 'detailed']).default('detailed').describe('Level of detail in response')
    },
}, async (args, extra) => {
    const { domain, fxf, assetName, format, detail } = args;
    try {
        // Validate that either fxf or assetName is provided
        if (!fxf && !assetName) {
            throw new Error("Either 'fxf' or 'assetName' must be provided");
        }
        // If FXF is provided directly, get schedule immediately
        if (fxf) {
            const scheduleData = await getSchedule(domain, fxf);
            const formatted = formatScheduleResponse(scheduleData);
            return {
                content: [
                    {
                        type: "text",
                        text: format === 'markdown'
                            ? `# Schedule Information\n\n**Domain:** ${domain}\n**FXF:** ${fxf}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                            : JSON.stringify(formatted, null, 2)
                    }
                ]
            };
        }
        // If asset name is provided, search catalog first
        if (assetName) {
            const catalogResponse = await searchCatalog(domain, assetName);
            if (!catalogResponse || catalogResponse.length === 0) {
                throw new Error(`No assets found matching name: "${assetName}"`);
            }
            // Filter for datasets only - other asset types don't have schedules
            const datasetAssets = catalogResponse.filter(asset => asset.resource?.type === 'dataset' || asset.classification?.domain_category === 'dataset');
            if (datasetAssets.length === 0) {
                const assetType = catalogResponse[0]?.resource?.type || catalogResponse[0]?.classification?.domain_category || 'asset';
                throw new Error(`${assetName} is a ${assetType} and does not have a schedule`);
            }
            // Get schedule info for all matching datasets
            const scheduleResults = [];
            for (const asset of datasetAssets) {
                try {
                    const name = asset.resource?.name || asset.name;
                    const assetFxf = asset.resource?.id || asset.id;
                    const scheduleData = await getSchedule(domain, assetFxf);
                    const formattedSchedule = formatScheduleResponse(scheduleData, { name, fxf: assetFxf });
                    scheduleResults.push(formattedSchedule);
                }
                catch (error) {
                    const name = asset.resource?.name || asset.name;
                    const assetFxf = asset.resource?.id || asset.id;
                    scheduleResults.push({
                        dataset: { name, fxf: assetFxf },
                        error: `Unable to fetch schedule: ${error instanceof Error ? error.message : String(error)}`
                    });
                }
            }
            const result = scheduleResults.length === 1 ? scheduleResults[0] : scheduleResults;
            const formatted = formatResponse(result, { format, detail });
            return {
                content: [
                    {
                        type: "text",
                        text: format === 'markdown'
                            ? `# Schedule Information\n\n**Domain:** ${domain}\n**Asset:** ${assetName}\n**Datasets Found:** ${scheduleResults.length}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                            : JSON.stringify(formatted, null, 2)
                    }
                ]
            };
        }
        throw new Error("Implementation error: function ended without return");
    }
    catch (error) {
        throw new Error(`Socrata schedule error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// =============================================================================
// ACTIVITY LOG TOOLS
// =============================================================================
server.registerTool("socrata_get_activity_log", {
    description: "Get activity log for a Socrata asset with filtering options for date range, activity type, and pagination",
    inputSchema: {
        domain: z.string().describe('The Socrata domain (e.g., "data.cityofchicago.org")'),
        assetId: z.string().describe('The asset ID (4x4 identifier)'),
        limit: z.number().min(1).max(1000).default(100).describe('Maximum number of results to return'),
        offset: z.number().min(0).default(0).describe('Number of results to skip for pagination'),
        startDate: z.string().optional().describe('Start date filter (ISO format, e.g., "2023-01-01")'),
        endDate: z.string().optional().describe('End date filter (ISO format, e.g., "2023-12-31")'),
        activityType: z.string().optional().describe('Filter by activity type (e.g., "create", "update", "delete")'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
        detail: z.enum(['concise', 'detailed']).default('detailed').describe('Level of detail in response')
    },
}, async (args, extra) => {
    const { domain, assetId, limit, offset, startDate, endDate, activityType, format, detail } = args;
    try {
        const activityLog = await getActivityLog(domain, assetId, {
            limit,
            offset,
            startDate,
            endDate,
            activityType
        });
        const formatted = formatResponse(activityLog, { format, detail });
        return {
            content: [
                {
                    type: "text",
                    text: format === 'markdown'
                        ? `# Activity Log\n\n**Domain:** ${domain}\n**Asset ID:** ${assetId}\n**Entries:** ${Array.isArray(activityLog) ? activityLog.length : 'Unknown'}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                        : JSON.stringify(formatted, null, 2)
                }
            ]
        };
    }
    catch (error) {
        throw new Error(`Socrata activity log error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// =============================================================================
// ROLE MANAGEMENT TOOLS
// =============================================================================
server.registerTool("socrata_get_user_roles", {
    description: "Get roles assigned to a specific user on a Socrata domain",
    inputSchema: {
        domain: z.string().describe('The Socrata domain (e.g., "data.cityofchicago.org")'),
        userId: z.string().describe('The user ID to get roles for'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
        detail: z.enum(['concise', 'detailed']).default('detailed').describe('Level of detail in response')
    },
}, async (args, extra) => {
    const { domain, userId, format, detail } = args;
    try {
        const roles = await getUserRoles(domain, userId);
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
        throw new Error(`Socrata user roles error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
server.registerTool("socrata_update_user_roles", {
    description: "Update roles for a specific user on a Socrata domain",
    inputSchema: {
        domain: z.string().describe('The Socrata domain (e.g., "data.cityofchicago.org")'),
        userId: z.string().describe('The user ID to update roles for'),
        roles: z.array(z.string()).describe('Array of role names to assign to the user'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format')
    },
}, async (args, extra) => {
    const { domain, userId, roles, format } = args;
    try {
        const result = await updateUserRoles(domain, userId, roles);
        const formatted = formatResponse(result, { format });
        return {
            content: [
                {
                    type: "text",
                    text: format === 'markdown'
                        ? `# User Roles Updated\n\n**Domain:** ${domain}\n**User ID:** ${userId}\n**Roles:** ${roles.join(', ')}\n**Status:** Success\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                        : JSON.stringify(formatted, null, 2)
                }
            ]
        };
    }
    catch (error) {
        throw new Error(`Socrata user roles update error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// =============================================================================
// WORKFLOW CONTEXT TOOLS
// =============================================================================
server.registerTool("socrata_get_workflow_context", {
    description: "Get workflow context information for a specific workflow on a Socrata domain",
    inputSchema: {
        domain: z.string().describe('The Socrata domain (e.g., "data.cityofchicago.org")'),
        workflowId: z.string().describe('The workflow ID to get context for'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
        detail: z.enum(['concise', 'detailed']).default('detailed').describe('Level of detail in response')
    },
}, async (args, extra) => {
    const { domain, workflowId, format, detail } = args;
    try {
        const context = await getWorkflowContext(domain, workflowId);
        const formatted = formatResponse(context, { format, detail });
        return {
            content: [
                {
                    type: "text",
                    text: format === 'markdown'
                        ? `# Workflow Context\n\n**Domain:** ${domain}\n**Workflow ID:** ${workflowId}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                        : JSON.stringify(formatted, null, 2)
                }
            ]
        };
    }
    catch (error) {
        throw new Error(`Socrata workflow context error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
server.registerTool("socrata_update_workflow_context", {
    description: "Update workflow context for a specific workflow on a Socrata domain",
    inputSchema: {
        domain: z.string().describe('The Socrata domain (e.g., "data.cityofchicago.org")'),
        workflowId: z.string().describe('The workflow ID to update context for'),
        context: z.record(z.any()).describe('The context data to update (JSON object)'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format')
    },
}, async (args, extra) => {
    const { domain, workflowId, context, format } = args;
    try {
        const result = await updateWorkflowContext(domain, workflowId, context);
        const formatted = formatResponse(result, { format });
        return {
            content: [
                {
                    type: "text",
                    text: format === 'markdown'
                        ? `# Workflow Context Updated\n\n**Domain:** ${domain}\n**Workflow ID:** ${workflowId}\n**Status:** Success\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                        : JSON.stringify(formatted, null, 2)
                }
            ]
        };
    }
    catch (error) {
        throw new Error(`Socrata workflow context update error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// =============================================================================
// METADATA UPDATE TOOLS
// =============================================================================
server.registerTool("socrata_update_metadata", {
    description: "Update metadata for a Socrata asset including name, description, tags, category, attribution, and license",
    inputSchema: {
        domain: z.string().describe('The Socrata domain (e.g., "data.cityofchicago.org")'),
        assetId: z.string().describe('The asset ID (4x4 identifier)'),
        name: z.string().optional().describe('New name for the asset'),
        description: z.string().optional().describe('New description for the asset'),
        tags: z.array(z.string()).optional().describe('Array of tags to set for the asset'),
        category: z.string().optional().describe('Category to assign to the asset'),
        attribution: z.string().optional().describe('Attribution information for the asset'),
        license: z.string().optional().describe('License for the asset'),
        format: z.enum(['json', 'markdown']).default('json').describe('Response format')
    },
}, async (args, extra) => {
    const { domain, assetId, name, description, tags, category, attribution, license, format } = args;
    try {
        const result = await updateMetadata(domain, assetId, {
            name,
            description,
            tags,
            category,
            attribution,
            license
        });
        const formatted = formatResponse(result, { format });
        return {
            content: [
                {
                    type: "text",
                    text: format === 'markdown'
                        ? `# Metadata Updated\n\n**Domain:** ${domain}\n**Asset ID:** ${assetId}\n**Status:** Success\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                        : JSON.stringify(formatted, null, 2)
                }
            ]
        };
    }
    catch (error) {
        throw new Error(`Socrata metadata update error: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=index-old.js.map