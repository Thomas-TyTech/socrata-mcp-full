import { z } from "zod";
export declare const accessLevelSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
}, {
    name: string;
    version: string;
}>;
export declare const userPermissionSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    accessLevels: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        version: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        version: string;
    }, {
        name: string;
        version: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    accessLevels: {
        name: string;
        version: string;
    }[];
    id?: string | undefined;
    email?: string | undefined;
}, {
    accessLevels: {
        name: string;
        version: string;
    }[];
    id?: string | undefined;
    email?: string | undefined;
}>;
/**
 * Get comprehensive metadata for a dataset/asset
 * Workflow: Understand dataset structure, properties, and characteristics before working with it
 */
export declare const assetMetadataGetTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        assetId: z.ZodString;
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
 * Update dataset metadata and properties
 * Workflow: Modify dataset information, tags, categorization after reviewing current metadata
 */
export declare const assetMetadataUpdateTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        assetId: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        category: z.ZodOptional<z.ZodString>;
        attribution: z.ZodOptional<z.ZodString>;
        license: z.ZodOptional<z.ZodString>;
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
/**
 * Get current permissions and access levels for an asset
 * Workflow: Review who has access to a dataset before making permission changes
 */
export declare const assetPermissionsGetTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        assetId: z.ZodString;
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
 * Update permissions and access levels for an asset
 * Workflow: Modify who can access a dataset and their permission levels after reviewing current state
 */
export declare const assetPermissionsUpdateTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        assetId: z.ZodString;
        scope: z.ZodOptional<z.ZodEnum<["private", "public", "site"]>>;
        users: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            accessLevels: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                version: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                version: string;
            }, {
                name: string;
                version: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            accessLevels: {
                name: string;
                version: string;
            }[];
            id?: string | undefined;
            email?: string | undefined;
        }, {
            accessLevels: {
                name: string;
                version: string;
            }[];
            id?: string | undefined;
            email?: string | undefined;
        }>, "many">>;
        replaceUsers: z.ZodDefault<z.ZodBoolean>;
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
export declare function getAssetMetadata(domain: string, assetId: string): Promise<any>;
export declare function getAssetPermissions(domain: string, assetId: string): Promise<any>;
export declare function updateAssetPermissions(domain: string, assetId: string, updates: any): Promise<any>;
//# sourceMappingURL=asset-tools.d.ts.map