import { z } from "zod";
/**
 * Get publishing schedule information for datasets
 * Workflow: Understand dataset update patterns and automation status for planning and analysis
 */
export declare const publishingScheduleGetTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        fxf: z.ZodOptional<z.ZodString>;
        assetName: z.ZodOptional<z.ZodString>;
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
export declare function searchCatalog(domain: string, query: string): Promise<any[]>;
export declare function getSchedule(domain: string, fxf: string): Promise<any>;
export declare function formatScheduleResponse(scheduleData: any, assetInfo?: {
    name: string;
    fxf: string;
}): any;
//# sourceMappingURL=publishing-tools.d.ts.map