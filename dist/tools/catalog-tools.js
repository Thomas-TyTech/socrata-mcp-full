import { z } from "zod";
import { validateDomain, socrataGet, formatResponse } from "../utils/socrata-utils.js";
// =============================================================================
// CATALOG AND DISCOVERY TOOLS
// Tools focused on discovering and exploring Socrata datasets and resources
// =============================================================================
/**
 * Get basic catalog for a Socrata domain with filtering
 * Workflow: Quick dataset discovery by type and category
 */
export const catalogGetTool = {
    name: "socrata_get_catalog",
    description: "Discover datasets on a Socrata domain by type and category. Use this for initial exploration of available data sources.",
    inputSchema: {
        domain: z.string().describe('Socrata domain to explore (e.g., "data.cityofchicago.org")'),
        type: z.enum(['dataset', 'filter', 'file']).describe('Type of resources to find'),
        category: z.string().optional().describe('Optional category filter (e.g., "Transportation", "Public Safety")'),
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
            throw new Error(`Failed to get catalog from ${domain}: ${error instanceof Error ? error.message : String(error)}. Try checking if the domain is accessible or adjust your filters.`);
        }
    }
};
/**
 * Advanced catalog search with comprehensive filtering
 * Workflow: Deep dataset discovery with multiple search criteria
 */
export const catalogSearchTool = {
    name: "socrata_search_catalog",
    description: "Search datasets across a Socrata domain with advanced filters. Use this when you need to find specific datasets by keywords, tags, attribution, or other criteria.",
    inputSchema: {
        domain: z.string().describe('Socrata domain to search (e.g., "data.cityofchicago.org")'),
        q: z.string().optional().describe('Search query keywords (searches titles, descriptions, column names)'),
        categories: z.array(z.string()).optional().describe('Categories to filter by (e.g., ["Transportation", "Public Safety"])'),
        tags: z.array(z.string()).optional().describe('Tags to filter by (e.g., ["crime", "traffic"])'),
        attribution: z.string().optional().describe('Data provider/organization filter'),
        provenance: z.string().optional().describe('Data source provenance filter'),
        visibility: z.enum(['open', 'private', 'internal']).optional().describe('Dataset visibility level'),
        order: z.enum(['relevance', 'name', 'createdAt', 'updatedAt', 'page_views_last_month']).default('relevance').describe('Sort order for results'),
        limit: z.number().min(1).max(100).default(20).describe('Number of results to return (1-100)'),
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
                            ? `# Dataset Search Results\n\n**Domain:** ${domain}\n**Query:** ${q || 'None'}\n**Results:** ${response.resultSetSize || 0}\n**Page:** ${Math.floor(offset / limit) + 1}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
                            : JSON.stringify(formatted, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            throw new Error(`Failed to search catalog on ${domain}: ${error instanceof Error ? error.message : String(error)}. Try simplifying your search terms or checking the domain accessibility.`);
        }
    }
};
//# sourceMappingURL=catalog-tools.js.map