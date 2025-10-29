export declare const CHARACTER_LIMIT = 25000;
export declare const DEFAULT_LIMIT = 100;
export declare const API_BASE_URL = "https://api.socrata.com";
/**
 * Domain validation utility
 */
export declare function validateDomain(domain: string): void;
/**
 * Get authentication headers for Socrata API requests
 */
export declare function getAuthHeaders(): HeadersInit;
/**
 * Make a GET request to the Socrata API
 */
export declare function socrataGet(url: string): Promise<any>;
/**
 * Make a POST request to the Socrata API
 */
export declare function socrataPost(url: string, data: any): Promise<any>;
/**
 * Make a PUT request to the Socrata API
 */
export declare function socrataPut(url: string, data: any): Promise<any>;
/**
 * Normalize array or comma-separated string to comma-separated string
 */
export declare function normalizeToCommaSeparated(value: string[] | string | undefined): string | undefined;
/**
 * Truncate response if it exceeds character limit
 */
export declare function truncateResponse(data: any, limit?: number): any;
/**
 * Format response with concise or detailed view
 */
export interface FormatOptions {
    format?: 'json' | 'markdown';
    detail?: 'concise' | 'detailed';
}
export declare function formatResponse(data: any, options?: FormatOptions): any;
//# sourceMappingURL=socrata-utils.d.ts.map