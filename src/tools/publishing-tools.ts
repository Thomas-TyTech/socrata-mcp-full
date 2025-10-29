import { z } from "zod";
import { validateDomain, socrataGet, formatResponse } from "../utils/socrata-utils.js";

// =============================================================================
// PUBLISHING AND SCHEDULING TOOLS
// Tools focused on understanding dataset publishing schedules, cadence, and automation
// =============================================================================

/**
 * Get publishing schedule information for datasets
 * Workflow: Understand dataset update patterns and automation status for planning and analysis
 */
export const publishingScheduleGetTool = {
  name: "socrata_get_schedule",
  description: "Get publishing schedule and update cadence information for Socrata datasets. Use this to understand how frequently data is updated and when to expect new information. Provide either the dataset ID directly or search by name.",
  inputSchema: {
    domain: z.string().describe('Socrata domain (e.g., "data.cityofchicago.org")'),
    fxf: z.string().optional().describe('Dataset identifier (4x4 format like "abcd-1234") - if you know the exact ID'),
    assetName: z.string().optional().describe('Dataset name to search for - will find matching datasets and show their schedules'),
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
    const { domain, fxf, assetName, format, detail } = args;
    try {
      // Validate that either fxf or assetName is provided
      if (!fxf && !assetName) {
        throw new Error("Either 'fxf' (dataset ID) or 'assetName' (dataset name) must be provided");
      }
      
      validateDomain(domain);
      
      // If FXF is provided directly, get schedule immediately
      if (fxf) {
        const scheduleData = await getSchedule(domain, fxf);
        const formatted = formatScheduleResponse(scheduleData);
        
        return {
          content: [
            {
              type: "text" as const,
              text: format === 'markdown'
                ? `# Publishing Schedule\n\n**Domain:** ${domain}\n**Dataset ID:** ${fxf}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                : JSON.stringify(formatted, null, 2)
            }
          ]
        };
      }

      // If asset name is provided, search catalog first
      if (assetName) {
        const catalogResponse = await searchCatalog(domain, assetName);

        if (!catalogResponse || catalogResponse.length === 0) {
          throw new Error(`No datasets found matching name: "${assetName}". Try searching the catalog first to find available datasets.`);
        }

        // Filter for datasets only - other asset types don't have schedules
        const datasetAssets = catalogResponse.filter((asset: any) =>
          asset.resource?.type === 'dataset' || asset.classification?.domain_category === 'dataset'
        );

        if (datasetAssets.length === 0) {
          const assetType = catalogResponse[0]?.resource?.type || catalogResponse[0]?.classification?.domain_category || 'asset';
          throw new Error(`"${assetName}" is a ${assetType} and does not have a publishing schedule. Only datasets have schedules.`);
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
          } catch (error) {
            const name = asset.resource?.name || asset.name;
            const assetFxf = asset.resource?.id || asset.id;
            scheduleResults.push({
              dataset: { name, fxf: assetFxf },
              schedule: null,
              error: `Unable to fetch schedule: ${error instanceof Error ? error.message : String(error)}`
            });
          }
        }

        const result = scheduleResults.length === 1 ? scheduleResults[0] : scheduleResults;
        const formatted = formatResponse(result, { format, detail });

        return {
          content: [
            {
              type: "text" as const,
              text: format === 'markdown'
                ? `# Publishing Schedule Results\n\n**Domain:** ${domain}\n**Search:** ${assetName}\n**Datasets Found:** ${scheduleResults.length}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                : JSON.stringify(formatted, null, 2)
            }
          ]
        };
      }
      
      throw new Error("Implementation error: function ended without return");
    } catch (error) {
      throw new Error(`Failed to get publishing schedule on ${domain}: ${error instanceof Error ? error.message : String(error)}. Try using a specific dataset ID or check if the dataset name is correct.`);
    }
  }
};

// Helper functions for publishing/scheduling
export async function searchCatalog(domain: string, query: string): Promise<any[]> {
  validateDomain(domain);
  const url = `https://${domain}/api/catalog/v1?domains=${domain}&q=${encodeURIComponent(query)}`;
  const response = await socrataGet(url);
  return response.results || [];
}

export async function getSchedule(domain: string, fxf: string): Promise<any> {
  validateDomain(domain);
  const url = `https://${domain}/api/publishing/v1/revision/datasets/${fxf}`;
  return await socrataGet(url);
}

export function formatScheduleResponse(scheduleData: any, assetInfo?: { name: string; fxf: string }): any {
  if (!scheduleData) {
    return {
      dataset: assetInfo || { name: "Unknown", fxf: "Unknown" },
      schedule: null,
      error: "No schedule data available - dataset may not have automated publishing"
    };
  }

  // Extract meaningful schedule information
  const schedule = {
    cadence: scheduleData.cadence || "Manual/None",
    status: scheduleData.status || "Unknown", 
    enabled: scheduleData.enabled || false,
    lastRun: scheduleData.lastRun || null,
    nextRun: scheduleData.nextRun || null,
    rowCount: scheduleData.rowCount || 0,
    owner: scheduleData.owner || "Unknown",
    frequency: scheduleData.frequency || null,
    timezone: scheduleData.timezone || null
  };

  const result = {
    dataset: assetInfo || {
      name: scheduleData.name || "Unknown",
      fxf: scheduleData.fxf || "Unknown"
    },
    schedule: schedule,
    summary: generateScheduleSummary(schedule)
  };

  return result;
}

function generateScheduleSummary(schedule: any): string {
  if (!schedule.enabled || schedule.cadence === "Manual/None") {
    return "Dataset is updated manually - no automated publishing schedule";
  }
  
  if (schedule.cadence && schedule.cadence !== "Manual/None") {
    const lastUpdate = schedule.lastRun ? new Date(schedule.lastRun).toLocaleDateString() : "Unknown";
    const nextUpdate = schedule.nextRun ? new Date(schedule.nextRun).toLocaleDateString() : "Not scheduled";
    return `Updates ${schedule.cadence.toLowerCase()}, last updated: ${lastUpdate}, next update: ${nextUpdate}`;
  }
  
  return "Schedule information available but status unclear";
}