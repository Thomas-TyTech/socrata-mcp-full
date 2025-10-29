import { z } from "zod";
import { validateDomain, socrataGet, socrataPut, formatResponse } from "../utils/socrata-utils.js";

// =============================================================================
// ASSET MANAGEMENT TOOLS
// Tools focused on managing dataset/asset metadata, permissions, and properties
// =============================================================================

// Schema for permission management
export const accessLevelSchema = z.object({
  name: z.string().describe('Access level name (e.g., "current_owner", "contributor", "viewer")'),
  version: z.string().describe('Version (typically "all")'),
});

export const userPermissionSchema = z.object({
  id: z.string().optional().describe('User ID for registered users'),
  email: z.string().optional().describe('Email address for unregistered users'),
  accessLevels: z.array(accessLevelSchema).describe('Array of access levels for this user'),
});

/**
 * Get comprehensive metadata for a dataset/asset
 * Workflow: Understand dataset structure, properties, and characteristics before working with it
 */
export const assetMetadataGetTool = {
  name: "socrata_get_metadata",
  description: "Retrieve comprehensive metadata for a Socrata dataset or asset. Use this to understand dataset structure, description, columns, and properties before analysis or modification.",
  inputSchema: {
    domain: z.string().describe('Socrata domain (e.g., "data.cityofchicago.org")'),
    assetId: z.string().describe('Asset ID (4x4 identifier like "xzkq-xp2w") - found in dataset URLs'),
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
    const { domain, assetId, format, detail } = args;
    try {
      validateDomain(domain);
      
      const url = `https://${domain}/api/views/${assetId}.json`;
      const metadata = await socrataGet(url);
      const formatted = formatResponse(metadata, { format, detail });

      return {
        content: [
          {
            type: "text" as const,
            text: format === 'markdown'
              ? `# Dataset Metadata\n\n**Domain:** ${domain}\n**Asset ID:** ${assetId}\n**Name:** ${metadata.name || 'Unknown'}\n**Description:** ${metadata.description || 'None'}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
              : JSON.stringify(formatted, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get metadata for asset ${assetId} on ${domain}: ${error instanceof Error ? error.message : String(error)}. Check if the asset ID is correct and publicly accessible.`);
    }
  }
};

/**
 * Update dataset metadata and properties
 * Workflow: Modify dataset information, tags, categorization after reviewing current metadata
 */
export const assetMetadataUpdateTool = {
  name: "socrata_update_metadata",
  description: "Update metadata for a Socrata dataset including name, description, tags, and categorization. Use this to improve dataset discoverability and documentation.",
  inputSchema: {
    domain: z.string().describe('Socrata domain (e.g., "data.cityofchicago.org")'),
    assetId: z.string().describe('Asset ID (4x4 identifier) to update'),
    name: z.string().optional().describe('New name for the dataset'),
    description: z.string().optional().describe('New description explaining the dataset contents and purpose'),
    tags: z.array(z.string()).optional().describe('Array of tags for categorization and search (e.g., ["crime", "safety", "police"])'),
    category: z.string().optional().describe('Primary category classification'),
    attribution: z.string().optional().describe('Data source attribution information'),
    license: z.string().optional().describe('License information for the dataset'),
    format: z.enum(['json', 'markdown']).default('json').describe('Response format')
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },
  handler: async (args: any, extra: any) => {
    const { domain, assetId, name, description, tags, category, attribution, license, format } = args;
    try {
      validateDomain(domain);
      
      // Get current metadata first
      const currentUrl = `https://${domain}/api/views/${assetId}.json`;
      const currentMetadata = await socrataGet(currentUrl);
      
      // Merge updates with current data
      const updatedMetadata = { ...currentMetadata };
      if (name !== undefined) updatedMetadata.name = name;
      if (description !== undefined) updatedMetadata.description = description;
      if (tags !== undefined) updatedMetadata.tags = tags;
      if (category !== undefined) updatedMetadata.category = category;
      if (attribution !== undefined) updatedMetadata.attribution = attribution;
      if (license !== undefined) updatedMetadata.license = license;
      
      const updateUrl = `https://${domain}/api/views/${assetId}.json`;
      const result = await socrataPut(updateUrl, updatedMetadata);
      const formatted = formatResponse(result, { format });

      return {
        content: [
          {
            type: "text" as const,
            text: format === 'markdown'
              ? `# Metadata Updated Successfully\n\n**Domain:** ${domain}\n**Asset ID:** ${assetId}\n**Updated Fields:** ${Object.keys({name, description, tags, category, attribution, license}).filter(k => args[k] !== undefined).join(', ')}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
              : JSON.stringify(formatted, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to update metadata for asset ${assetId} on ${domain}: ${error instanceof Error ? error.message : String(error)}. Check if you have edit permissions for this asset.`);
    }
  }
};

/**
 * Get current permissions and access levels for an asset
 * Workflow: Review who has access to a dataset before making permission changes
 */
export const assetPermissionsGetTool = {
  name: "socrata_get_permissions",
  description: "Check current permissions and access levels for a Socrata dataset. Use this before modifying permissions to understand the current access structure.",
  inputSchema: {
    domain: z.string().describe('Socrata domain (e.g., "data.cityofchicago.org")'),
    assetId: z.string().describe('Asset ID (4x4 identifier) to check permissions for'),
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
    const { domain, assetId, format, detail } = args;
    try {
      validateDomain(domain);
      
      const url = `https://${domain}/api/assets/${assetId}/permissions.json`;
      const permissions = await socrataGet(url);
      const formatted = formatResponse(permissions, { format, detail });

      return {
        content: [
          {
            type: "text" as const,
            text: format === 'markdown'
              ? `# Asset Permissions\n\n**Domain:** ${domain}\n**Asset ID:** ${assetId}\n**Scope:** ${permissions.scope || 'Unknown'}\n**Users with Access:** ${Array.isArray(permissions.users) ? permissions.users.length : 'Unknown'}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
              : JSON.stringify(formatted, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get permissions for asset ${assetId} on ${domain}: ${error instanceof Error ? error.message : String(error)}. Check if you have permission to view access settings for this asset.`);
    }
  }
};

/**
 * Update permissions and access levels for an asset
 * Workflow: Modify who can access a dataset and their permission levels after reviewing current state
 */
export const assetPermissionsUpdateTool = {
  name: "socrata_update_permissions",
  description: "Modify access permissions for a Socrata dataset. This tool gets current permissions, merges your changes, and applies the updates. Use after checking current permissions.",
  inputSchema: {
    domain: z.string().describe('Socrata domain (e.g., "data.cityofchicago.org")'),
    assetId: z.string().describe('Asset ID (4x4 identifier) to update permissions for'),
    scope: z.enum(['private', 'public', 'site']).optional().describe('Access scope: "private" (owner only), "public" (everyone), "site" (domain users only)'),
    users: z.array(userPermissionSchema).optional().describe('Array of users with their specific access levels'),
    replaceUsers: z.boolean().default(false).describe('If true, replace all existing users; if false, merge with current users'),
    format: z.enum(['json', 'markdown']).default('json').describe('Response format')
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true
  },
  handler: async (args: any, extra: any) => {
    const { domain, assetId, scope, users, replaceUsers, format } = args;
    try {
      validateDomain(domain);
      
      // Get current permissions first
      const getUrl = `https://${domain}/api/assets/${assetId}/permissions.json`;
      const currentPermissions = await socrataGet(getUrl);
      
      // Merge updates with current permissions
      const updatedPermissions = { ...currentPermissions };
      
      if (scope) {
        updatedPermissions.scope = scope;
      }
      
      if (users) {
        if (replaceUsers) {
          updatedPermissions.users = users;
        } else {
          // Merge with existing users
          const existingUsers = updatedPermissions.users || [];
          const updatedUsers = [...existingUsers];
          
          for (const newUser of users) {
            const existingIndex = existingUsers.findIndex((u: any) => 
              (newUser.id && u.id === newUser.id) || 
              (newUser.email && u.email === newUser.email)
            );
            
            if (existingIndex >= 0) {
              updatedUsers[existingIndex] = { ...updatedUsers[existingIndex], ...newUser };
            } else {
              updatedUsers.push(newUser);
            }
          }
          
          updatedPermissions.users = updatedUsers;
        }
      }
      
      const updateUrl = `https://${domain}/api/assets/${assetId}/permissions.json`;
      const result = await socrataPut(updateUrl, updatedPermissions);
      const formatted = formatResponse(result, { format });

      return {
        content: [
          {
            type: "text" as const,
            text: format === 'markdown'
              ? `# Permissions Updated Successfully\n\n**Domain:** ${domain}\n**Asset ID:** ${assetId}\n**New Scope:** ${scope || 'Unchanged'}\n**User Updates:** ${users ? `${users.length} users ${replaceUsers ? 'replaced' : 'merged'}` : 'None'}\n\n\`\`\`json\n${JSON.stringify(formatted, null, 2)}\n\`\`\``
              : JSON.stringify(formatted, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to update permissions for asset ${assetId} on ${domain}: ${error instanceof Error ? error.message : String(error)}. Check if you have admin permissions for this asset and the user/email addresses are valid.`);
    }
  }
};

// Helper functions for asset management
export async function getAssetMetadata(domain: string, assetId: string): Promise<any> {
  validateDomain(domain);
  const url = `https://${domain}/api/views/${assetId}.json`;
  return await socrataGet(url);
}

export async function getAssetPermissions(domain: string, assetId: string): Promise<any> {
  validateDomain(domain);
  const url = `https://${domain}/api/assets/${assetId}/permissions.json`;
  return await socrataGet(url);
}

export async function updateAssetPermissions(domain: string, assetId: string, updates: any): Promise<any> {
  validateDomain(domain);
  const currentPermissions = await getAssetPermissions(domain, assetId);
  const updatedPermissions = { ...currentPermissions, ...updates };
  const url = `https://${domain}/api/assets/${assetId}/permissions.json`;
  return await socrataPut(url, updatedPermissions);
}