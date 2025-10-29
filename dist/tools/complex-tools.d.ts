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
export declare function getPermissions(domain: string, assetId: string): Promise<any>;
export declare function updatePermissions(domain: string, assetId: string, updates: {
    scope?: 'private' | 'public' | 'site';
    users?: Array<{
        id?: string;
        email?: string;
        accessLevels: Array<{
            name: string;
            version: string;
        }>;
    }>;
    replaceUsers?: boolean;
}): Promise<any>;
export declare function searchCatalog(domain: string, query: string): Promise<any[]>;
export declare function getSchedule(domain: string, fxf: string): Promise<any>;
export declare function formatScheduleResponse(scheduleData: any, assetInfo?: {
    name: string;
    fxf: string;
}): any;
export declare function getActivityLog(domain: string, assetId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    activityType?: string;
}): Promise<any>;
export declare function getUserRoles(domain: string, userId: string): Promise<any>;
export declare function updateUserRoles(domain: string, userId: string, roles: string[]): Promise<any>;
export declare function getWorkflowContext(domain: string, workflowId: string): Promise<any>;
export declare function updateWorkflowContext(domain: string, workflowId: string, context: any): Promise<any>;
export declare function updateMetadata(domain: string, assetId: string, updates: {
    name?: string;
    description?: string;
    tags?: string[];
    category?: string;
    attribution?: string;
    license?: string;
}): Promise<any>;
//# sourceMappingURL=complex-tools.d.ts.map