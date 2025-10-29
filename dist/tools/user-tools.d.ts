import { z } from "zod";
/**
 * Search and discover users within a Socrata domain
 * Workflow: Find users for collaboration, permission management, or audit purposes
 */
export declare const userSearchTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        ids: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodString]>>;
        emails: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodString]>>;
        roles: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodString]>>;
        disabled: z.ZodOptional<z.ZodBoolean>;
        future: z.ZodOptional<z.ZodBoolean>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
        format: z.ZodDefault<z.ZodEnum<["json", "markdown"]>>;
        detail: z.ZodDefault<z.ZodEnum<["concise", "detailed"]>>;
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
    handler: (args: any, extra: any) => Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
};
/**
 * Search and discover teams within a Socrata domain
 * Workflow: Find teams for collaboration or organizational understanding
 */
export declare const teamSearchTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        ids: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodString]>>;
        names: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodString]>>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
        format: z.ZodDefault<z.ZodEnum<["json", "markdown"]>>;
        detail: z.ZodDefault<z.ZodEnum<["concise", "detailed"]>>;
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
    handler: (args: any, extra: any) => Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
};
/**
 * Get roles assigned to a specific user
 * Workflow: Check user permissions before making changes or understanding access levels
 */
export declare const userRolesGetTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        userId: z.ZodString;
        format: z.ZodDefault<z.ZodEnum<["json", "markdown"]>>;
        detail: z.ZodDefault<z.ZodEnum<["concise", "detailed"]>>;
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
    handler: (args: any, extra: any) => Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
};
/**
 * Update roles for a specific user
 * Workflow: Modify user permissions after checking current state
 */
export declare const userRolesUpdateTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        userId: z.ZodString;
        roles: z.ZodArray<z.ZodString, "many">;
        format: z.ZodDefault<z.ZodEnum<["json", "markdown"]>>;
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
    handler: (args: any, extra: any) => Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
};
export declare function getUserRoles(domain: string, userId: string): Promise<any>;
export declare function updateUserRoles(domain: string, userId: string, roles: string[]): Promise<any>;
//# sourceMappingURL=user-tools.d.ts.map