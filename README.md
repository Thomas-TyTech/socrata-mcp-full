# Socrata MCP Server v2.0.0

A high-quality Model Context Protocol (MCP) server following best practices for agent-centric design. Provides comprehensive tools for interacting with Socrata Open Data APIs.

## ✨ Agent-Centric Design

Built following MCP best practices with **workflow-focused tools** organized by domain for optimal agent usability:

- **Workflow-Based Tool Design** - Tools consolidate related operations for complete task completion
- **Optimized Context Usage** - Concise vs detailed response options to manage token usage  
- **Actionable Error Messages** - Clear guidance for agents on how to resolve issues
- **Natural Task Organization** - Tools grouped by logical workflow domains
- **Comprehensive Annotations** - Full MCP tool metadata for optimal agent interaction

## 🛠️ Tool Collection

This MCP server includes **12 comprehensive tools** organized across **6 domain areas**:

### Catalog and Search Tools
- **socrata_get_catalog** - Get catalog for a domain, filtered by category and type
- **socrata_search_catalog** - Advanced catalog search with multiple filters, sorting, and pagination
- **socrata_search_users** - Search for users with filters for IDs, emails, roles, and status
- **socrata_search_teams** - Search for teams with various filters

### Asset Management Tools
- **socrata_get_metadata** - Get metadata for a specific asset by its 4x4 identifier
- **socrata_update_metadata** - Update asset metadata (name, description, tags, etc.)

### Permissions Management
- **socrata_get_permissions** - Get current permissions for an asset
- **socrata_update_permissions** - Update asset permissions (scope and user access levels)

### Publishing and Scheduling
- **socrata_get_schedule** - Get publishing schedule and cadence information for datasets

### Activity and Audit
- **socrata_get_activity_log** - Get activity log with filtering for date range and activity type

### User and Role Management
- **socrata_get_user_roles** - Get roles assigned to a specific user
- **socrata_update_user_roles** - Update roles for a specific user

### Workflow Management
- **socrata_get_workflow_context** - Get workflow context information
- **socrata_update_workflow_context** - Update workflow context

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the server:
   ```bash
   npm run build
   ```

## Configuration

Set the following environment variables:

- `SOCRATA_DOMAIN` - Comma-separated list of allowed Socrata domains (optional, empty means all domains allowed)
- `SOCRATA_ID` - Socrata app ID for authentication (optional)
- `SOCRATA_SECRET` - Socrata app secret for authentication (optional)

## Usage

### Running the Server

```bash
npm run start
```

The server listens on stdio transport and follows the MCP protocol specification.

### Example Configuration for Claude Desktop

Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "socrata": {
      "command": "node",
      "args": ["/path/to/socrata-mcp-server/dist/index.js"],
      "env": {
        "SOCRATA_DOMAIN": "data.cityofchicago.org,data.seattle.gov",
        "SOCRATA_ID": "your_app_id",
        "SOCRATA_SECRET": "your_app_secret"
      }
    }
  }
}
```

## Tool Features

All tools include:

- **Input validation** with Zod schemas
- **Flexible response formats** (JSON or Markdown)
- **Detail levels** (Concise or Detailed)
- **Comprehensive error handling**
- **Domain validation** and authentication
- **Pagination support** where applicable
- **Character limits** and truncation for large responses

## API Coverage

This server covers the major Socrata API endpoints:

- Catalog API v1 (search, filtering, metadata)
- Assets API (permissions, metadata updates)
- Publishing API v1 (schedules and cadence)
- Users and Teams API (search and management)
- Activity Log API (audit trail)
- Workflow API (context management)

## Security

- Domain allowlisting to restrict access to specific Socrata instances
- Secure authentication using app ID and secret
- Input validation on all parameters
- Error handling that doesn't expose sensitive information

## Development

The server is built with:

- **TypeScript** for type safety
- **MCP TypeScript SDK** for protocol compliance
- **Zod** for runtime schema validation
- **Node.js 20+** for modern JavaScript features

### Project Structure

```
src/
├── index.ts                    # Main server with domain-organized tool registration
├── utils/
│   └── socrata-utils.ts       # Common utilities and API helpers
└── tools/                     # Domain-specific tool collections
    ├── catalog-tools.ts       # Dataset discovery and search
    ├── user-tools.ts          # User and team management
    ├── asset-tools.ts         # Asset metadata and permissions
    ├── publishing-tools.ts    # Publishing schedules and automation
    ├── activity-tools.ts      # Activity logs and audit trails
    └── workflow-tools.ts      # Workflow context management
```

## 🏗️ Architecture Highlights

### Domain-Organized Structure
- **Logical Grouping**: Tools organized by workflow domain, not API structure
- **Maintainable Code**: Each domain in separate files for easy maintenance
- **Discoverable Tools**: Consistent naming and grouping for agent discoverability

### MCP Best Practices Implementation
- **Tool Annotations**: Complete metadata with `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`
- **Workflow Focus**: Tools designed for complete tasks, not just API endpoint wrapping
- **Agent-Friendly**: Error messages guide agents toward correct usage patterns
- **Context Optimization**: Flexible response formats and detail levels

### Quality Assurance
- **TypeScript Strict Mode**: Full type safety and compile-time error checking
- **Zod Schema Validation**: Runtime input validation with descriptive error messages
- **Comprehensive Error Handling**: Graceful failure modes with actionable guidance
- **Production Ready**: Proper lifecycle management and graceful shutdown handling