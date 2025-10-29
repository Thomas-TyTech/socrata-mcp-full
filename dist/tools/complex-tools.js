import { z } from "zod";
import { validateDomain, socrataGet, socrataPut } from "../utils/socrata-utils.js";
// =============================================================================
// SCHEMAS FOR COMPLEX TOOLS
// =============================================================================
export const accessLevelSchema = z.object({
    name: z.string().describe('Access level name (e.g., "current_owner", "contributor", "viewer")'),
    version: z.string().describe('Version (typically "all")'),
});
export const userPermissionSchema = z.object({
    id: z.string().optional().describe('User ID for registered users'),
    email: z.string().optional().describe('Email address for unregistered users'),
    accessLevels: z.array(accessLevelSchema).describe('Array of access levels for this user'),
});
// =============================================================================
// PERMISSIONS FUNCTIONS
// =============================================================================
export async function getPermissions(domain, assetId) {
    validateDomain(domain);
    const url = `https://${domain}/api/assets/${assetId}/permissions.json`;
    return await socrataGet(url);
}
export async function updatePermissions(domain, assetId, updates) {
    validateDomain(domain);
    // Get current permissions first
    const currentPermissions = await getPermissions(domain, assetId);
    // Merge updates with current permissions
    const updatedPermissions = { ...currentPermissions };
    if (updates.scope) {
        updatedPermissions.scope = updates.scope;
    }
    if (updates.users) {
        if (updates.replaceUsers) {
            updatedPermissions.users = updates.users;
        }
        else {
            // Merge with existing users
            const existingUsers = updatedPermissions.users || [];
            const updatedUsers = [...existingUsers];
            for (const newUser of updates.users) {
                const existingIndex = existingUsers.findIndex((u) => (newUser.id && u.id === newUser.id) ||
                    (newUser.email && u.email === newUser.email));
                if (existingIndex >= 0) {
                    updatedUsers[existingIndex] = { ...updatedUsers[existingIndex], ...newUser };
                }
                else {
                    updatedUsers.push(newUser);
                }
            }
            updatedPermissions.users = updatedUsers;
        }
    }
    const url = `https://${domain}/api/assets/${assetId}/permissions.json`;
    return await socrataPut(url, updatedPermissions);
}
// =============================================================================
// SCHEDULE FUNCTIONS
// =============================================================================
export async function searchCatalog(domain, query) {
    validateDomain(domain);
    const url = `https://${domain}/api/catalog/v1?domains=${domain}&q=${encodeURIComponent(query)}`;
    const response = await socrataGet(url);
    return response.results || [];
}
export async function getSchedule(domain, fxf) {
    validateDomain(domain);
    const url = `https://${domain}/api/publishing/v1/revision/datasets/${fxf}`;
    return await socrataGet(url);
}
export function formatScheduleResponse(scheduleData, assetInfo) {
    if (!scheduleData) {
        return {
            error: "No schedule data available"
        };
    }
    const formatted = {
        dataset: assetInfo || {
            name: scheduleData.name || "Unknown",
            fxf: scheduleData.fxf || "Unknown"
        },
        schedule: {
            cadence: scheduleData.cadence || "None",
            status: scheduleData.status || "Unknown",
            enabled: scheduleData.enabled || false,
            lastRun: scheduleData.lastRun || null,
            nextRun: scheduleData.nextRun || null,
            rowCount: scheduleData.rowCount || 0,
            owner: scheduleData.owner || "Unknown"
        }
    };
    return formatted;
}
// =============================================================================
// ACTIVITY LOG FUNCTIONS
// =============================================================================
export async function getActivityLog(domain, assetId, options = {}) {
    validateDomain(domain);
    const url = new URL(`https://${domain}/api/catalog/v1/activity_log`);
    url.searchParams.append('asset_id', assetId);
    if (options.limit)
        url.searchParams.append('limit', options.limit.toString());
    if (options.offset)
        url.searchParams.append('offset', options.offset.toString());
    if (options.startDate)
        url.searchParams.append('start_date', options.startDate);
    if (options.endDate)
        url.searchParams.append('end_date', options.endDate);
    if (options.activityType)
        url.searchParams.append('activity_type', options.activityType);
    return await socrataGet(url.toString());
}
// =============================================================================
// ROLE FUNCTIONS
// =============================================================================
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
// =============================================================================
// WORKFLOW CONTEXT FUNCTIONS
// =============================================================================
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
// =============================================================================
// METADATA UPDATE FUNCTIONS
// =============================================================================
export async function updateMetadata(domain, assetId, updates) {
    validateDomain(domain);
    // Get current metadata
    const currentMetadata = await socrataGet(`https://${domain}/api/views/${assetId}.json`);
    // Merge updates
    const updatedMetadata = { ...currentMetadata };
    if (updates.name !== undefined)
        updatedMetadata.name = updates.name;
    if (updates.description !== undefined)
        updatedMetadata.description = updates.description;
    if (updates.tags !== undefined)
        updatedMetadata.tags = updates.tags;
    if (updates.category !== undefined)
        updatedMetadata.category = updates.category;
    if (updates.attribution !== undefined)
        updatedMetadata.attribution = updates.attribution;
    if (updates.license !== undefined)
        updatedMetadata.license = updates.license;
    const url = `https://${domain}/api/views/${assetId}.json`;
    return await socrataPut(url, updatedMetadata);
}
//# sourceMappingURL=complex-tools.js.map