import { z } from "zod";
/**
 * Get activity log and audit trail for datasets
 * Workflow: Track changes, monitor dataset activity, and maintain audit compliance
 */
export declare const activityLogGetTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        assetId: z.ZodString;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        activityType: z.ZodOptional<z.ZodString>;
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
export declare function getActivityLog(domain: string, assetId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    activityType?: string;
}): Promise<any>;
//# sourceMappingURL=activity-tools.d.ts.map