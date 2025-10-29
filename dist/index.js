#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// Import domain-specific tool collections
import { catalogGetTool, catalogSearchTool } from "./tools/catalog-tools.js";
import { userSearchTool, teamSearchTool, userRolesGetTool, userRolesUpdateTool } from "./tools/user-tools.js";
import { assetMetadataGetTool, assetMetadataUpdateTool, assetPermissionsGetTool, assetPermissionsUpdateTool } from "./tools/asset-tools.js";
import { publishingScheduleGetTool } from "./tools/publishing-tools.js";
import { activityLogGetTool } from "./tools/activity-tools.js";
import { workflowContextGetTool, workflowContextUpdateTool } from "./tools/workflow-tools.js";
// =============================================================================
// SOCRATA MCP SERVER
// High-quality MCP server following best practices for agent-centric design
// =============================================================================
/**
 * Create the MCP server with comprehensive Socrata Open Data API integration
 * Organized by workflow domains for optimal agent usability
 */
const server = new McpServer({
    name: "socrata-mcp-server",
    version: "2.0.0"
});
// =============================================================================
// CATALOG AND DISCOVERY TOOLS
// Enable agents to discover and explore available datasets
// =============================================================================
server.registerTool(catalogGetTool.name, {
    description: catalogGetTool.description,
    inputSchema: catalogGetTool.inputSchema,
    annotations: catalogGetTool.annotations
}, catalogGetTool.handler);
server.registerTool(catalogSearchTool.name, {
    description: catalogSearchTool.description,
    inputSchema: catalogSearchTool.inputSchema,
    annotations: catalogSearchTool.annotations
}, catalogSearchTool.handler);
// =============================================================================
// USER AND TEAM MANAGEMENT TOOLS
// Enable agents to manage users, teams, and their roles
// =============================================================================
server.registerTool(userSearchTool.name, {
    description: userSearchTool.description,
    inputSchema: userSearchTool.inputSchema,
    annotations: userSearchTool.annotations
}, userSearchTool.handler);
server.registerTool(teamSearchTool.name, {
    description: teamSearchTool.description,
    inputSchema: teamSearchTool.inputSchema,
    annotations: teamSearchTool.annotations
}, teamSearchTool.handler);
server.registerTool(userRolesGetTool.name, {
    description: userRolesGetTool.description,
    inputSchema: userRolesGetTool.inputSchema,
    annotations: userRolesGetTool.annotations
}, userRolesGetTool.handler);
server.registerTool(userRolesUpdateTool.name, {
    description: userRolesUpdateTool.description,
    inputSchema: userRolesUpdateTool.inputSchema,
    annotations: userRolesUpdateTool.annotations
}, userRolesUpdateTool.handler);
// =============================================================================
// ASSET MANAGEMENT TOOLS
// Enable agents to manage dataset metadata and permissions
// =============================================================================
server.registerTool(assetMetadataGetTool.name, {
    description: assetMetadataGetTool.description,
    inputSchema: assetMetadataGetTool.inputSchema,
    annotations: assetMetadataGetTool.annotations
}, assetMetadataGetTool.handler);
server.registerTool(assetMetadataUpdateTool.name, {
    description: assetMetadataUpdateTool.description,
    inputSchema: assetMetadataUpdateTool.inputSchema,
    annotations: assetMetadataUpdateTool.annotations
}, assetMetadataUpdateTool.handler);
server.registerTool(assetPermissionsGetTool.name, {
    description: assetPermissionsGetTool.description,
    inputSchema: assetPermissionsGetTool.inputSchema,
    annotations: assetPermissionsGetTool.annotations
}, assetPermissionsGetTool.handler);
server.registerTool(assetPermissionsUpdateTool.name, {
    description: assetPermissionsUpdateTool.description,
    inputSchema: assetPermissionsUpdateTool.inputSchema,
    annotations: assetPermissionsUpdateTool.annotations
}, assetPermissionsUpdateTool.handler);
// =============================================================================
// PUBLISHING AND SCHEDULING TOOLS
// Enable agents to understand dataset update patterns and automation
// =============================================================================
server.registerTool(publishingScheduleGetTool.name, {
    description: publishingScheduleGetTool.description,
    inputSchema: publishingScheduleGetTool.inputSchema,
    annotations: publishingScheduleGetTool.annotations
}, publishingScheduleGetTool.handler);
// =============================================================================
// ACTIVITY AND AUDIT TOOLS
// Enable agents to track changes and maintain compliance
// =============================================================================
server.registerTool(activityLogGetTool.name, {
    description: activityLogGetTool.description,
    inputSchema: activityLogGetTool.inputSchema,
    annotations: activityLogGetTool.annotations
}, activityLogGetTool.handler);
// =============================================================================
// WORKFLOW MANAGEMENT TOOLS
// Enable agents to manage automation and process coordination
// =============================================================================
server.registerTool(workflowContextGetTool.name, {
    description: workflowContextGetTool.description,
    inputSchema: workflowContextGetTool.inputSchema,
    annotations: workflowContextGetTool.annotations
}, workflowContextGetTool.handler);
server.registerTool(workflowContextUpdateTool.name, {
    description: workflowContextUpdateTool.description,
    inputSchema: workflowContextUpdateTool.inputSchema,
    annotations: workflowContextUpdateTool.annotations
}, workflowContextUpdateTool.handler);
// =============================================================================
// SERVER STARTUP
// =============================================================================
/**
 * Start the MCP server and connect to stdio transport
 * Following MCP best practices for server lifecycle management
 */
async function main() {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        // Log server startup (will be captured by MCP client)
        console.error(`Socrata MCP Server v2.0.0 started successfully`);
        console.error(`Registered 12 tools across 6 domain areas`);
        console.error(`Ready to serve Socrata Open Data API requests`);
    }
    catch (error) {
        console.error("Failed to start Socrata MCP Server:", error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.error('Received SIGINT, shutting down gracefully...');
    await server.close();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.error('Received SIGTERM, shutting down gracefully...');
    await server.close();
    process.exit(0);
});
// Start the server
main().catch((error) => {
    console.error("Unexpected server error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map