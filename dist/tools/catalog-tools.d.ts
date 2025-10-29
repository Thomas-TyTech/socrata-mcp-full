import { z } from "zod";
/**
 * Get basic catalog for a Socrata domain with filtering
 * Workflow: Quick dataset discovery by type and category
 */
export declare const catalogGetTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        type: z.ZodEnum<["dataset", "filter", "file"]>;
        category: z.ZodOptional<z.ZodString>;
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
 * Advanced catalog search with comprehensive filtering
 * Workflow: Deep dataset discovery with multiple search criteria
 */
export declare const catalogSearchTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        q: z.ZodOptional<z.ZodString>;
        categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        attribution: z.ZodOptional<z.ZodString>;
        provenance: z.ZodOptional<z.ZodString>;
        visibility: z.ZodOptional<z.ZodEnum<["open", "private", "internal"]>>;
        order: z.ZodDefault<z.ZodEnum<["relevance", "name", "createdAt", "updatedAt", "page_views_last_month"]>>;
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
//# sourceMappingURL=catalog-tools.d.ts.map