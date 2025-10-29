import { z } from "zod";
/**
 * Get workflow context and configuration information
 * Workflow: Understand current workflow state before making modifications
 */
export declare const workflowContextGetTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        workflowId: z.ZodString;
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
 * Update workflow context and configuration
 * Workflow: Modify workflow settings after reviewing current context
 */
export declare const workflowContextUpdateTool: {
    name: string;
    description: string;
    inputSchema: {
        domain: z.ZodString;
        workflowId: z.ZodString;
        context: z.ZodRecord<z.ZodString, z.ZodAny>;
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
export declare function getWorkflowContext(domain: string, workflowId: string): Promise<any>;
export declare function updateWorkflowContext(domain: string, workflowId: string, context: any): Promise<any>;
//# sourceMappingURL=workflow-tools.d.ts.map