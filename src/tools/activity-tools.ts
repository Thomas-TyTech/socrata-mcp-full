import { z } from "zod";
import { validateDomain, socrataGet, formatResponse } from "../utils/socrata-utils.js";

// =============================================================================
// ACTIVITY AND AUDIT TOOLS
// Tools focused on tracking changes, monitoring activity, and maintaining audit trails
// =============================================================================

/**
 * Get activity log and audit trail for datasets
 * Workflow: Track changes, monitor dataset activity, and maintain audit compliance
 */
export const activityLogGetTool = {
  name: "socrata_get_activity_log",
  description: "Retrieve activity log and audit trail for a Socrata dataset. Use this to track changes, monitor who accessed or modified data, and maintain compliance records.",
  inputSchema: {
    domain: z.string().describe('Socrata domain (e.g., "data.cityofchicago.org")'),
    assetId: z.string().describe('Asset ID (4x4 identifier) to get activity log for'),
    limit: z.number().min(1).max(1000).default(100).describe('Maximum number of activity entries to return (1-1000)'),
    offset: z.number().min(0).default(0).describe('Offset for pagination through activity history'),
    startDate: z.string().optional().describe('Start date filter in ISO format (e.g., "2023-01-01") - only show activity after this date'),
    endDate: z.string().optional().describe('End date filter in ISO format (e.g., "2023-12-31") - only show activity before this date'),
    activityType: z.string().optional().describe('Filter by specific activity type (e.g., "create", "update", "delete", "view", "download")'),
    format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    detail: z.enum(['concise', 'detailed']).default('detailed').describe('Level of detail in response')
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },
  handler: async (args: any, extra: any) => {
    const { domain, assetId, limit, offset, startDate, endDate, activityType, format, detail } = args;
    try {
      validateDomain(domain);
      
      const activityLog = await getActivityLog(domain, assetId, {
        limit,
        offset,
        startDate,
        endDate,
        activityType
      });
      
      const formatted = formatResponse(activityLog, { format, detail });

      // Generate summary for markdown format
      let summary = "";
      if (format === 'markdown' && Array.isArray(activityLog)) {
        const totalEntries = activityLog.length;
        const dateRange = startDate || endDate ? ` (${startDate || 'beginning'} to ${endDate || 'now'})` : '';
        const typeFilter = activityType ? ` of type "${activityType}"` : '';
        summary = `**Activity Summary:** ${totalEntries} entries found${typeFilter}${dateRange}`;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: format === 'markdown'
              ? `# Activity Log\n\n**Domain:** ${domain}\n**Asset ID:** ${assetId}\n${summary}\n**Page:** ${Math.floor(offset / limit) + 1}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
              : JSON.stringify(formatted, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get activity log for asset ${assetId} on ${domain}: ${error instanceof Error ? error.message : String(error)}. Check if the asset exists and you have permission to view its activity log.`);
    }
  }
};

// Helper function for activity log retrieval
export async function getActivityLog(
  domain: string,
  assetId: string,
  options: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    activityType?: string;
  } = {}
): Promise<any> {
  validateDomain(domain);
  
  const url = new URL(`https://${domain}/api/catalog/v1/activity_log`);
  url.searchParams.append('asset_id', assetId);
  
  if (options.limit) url.searchParams.append('limit', options.limit.toString());
  if (options.offset) url.searchParams.append('offset', options.offset.toString());
  if (options.startDate) url.searchParams.append('start_date', options.startDate);
  if (options.endDate) url.searchParams.append('end_date', options.endDate);
  if (options.activityType) url.searchParams.append('activity_type', options.activityType);
  
  return await socrataGet(url.toString());
}