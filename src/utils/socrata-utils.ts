// Configuration and utilities for Socrata API
export const CHARACTER_LIMIT = 25000;
export const DEFAULT_LIMIT = 100;
export const API_BASE_URL = 'https://api.socrata.com';

// Configuration
const ALLOWED_DOMAINS = process.env.SOCRATA_DOMAIN
  ? process.env.SOCRATA_DOMAIN.split(',').map(d => d.trim())
  : []; // Empty array means all domains allowed

/**
 * Domain validation utility
 */
export function validateDomain(domain: string): void {
  if (ALLOWED_DOMAINS.length > 0 && !ALLOWED_DOMAINS.includes(domain)) {
    throw new Error(`Domain "${domain}" is not in the allowlist. Allowed domains: ${ALLOWED_DOMAINS.join(', ')}`);
  }
}

/**
 * Get authentication headers for Socrata API requests
 */
export function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  const appId = process.env.SOCRATA_ID;
  const appSecret = process.env.SOCRATA_SECRET;

  if (appId && appSecret) {
    // Add Basic Auth if both credentials are present
    const auth = Buffer.from(`${appId}:${appSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  return headers;
}

/**
 * Make a GET request to the Socrata API
 */
export async function socrataGet(url: string): Promise<any> {
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Socrata API error (${response.status}): ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Make a POST request to the Socrata API
 */
export async function socrataPost(url: string, data: any): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Socrata API error (${response.status}): ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Make a PUT request to the Socrata API
 */
export async function socrataPut(url: string, data: any): Promise<any> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Socrata API error (${response.status}): ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Normalize array or comma-separated string to comma-separated string
 */
export function normalizeToCommaSeparated(value: string[] | string | undefined): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(',') : undefined;
  }
  return value;
}

/**
 * Truncate response if it exceeds character limit
 */
export function truncateResponse(data: any, limit: number = CHARACTER_LIMIT): any {
  const jsonString = JSON.stringify(data, null, 2);
  if (jsonString.length <= limit) {
    return data;
  }

  const truncated = jsonString.substring(0, limit - 100);
  return {
    ...data,
    _truncated: true,
    _message: `Response truncated at ${limit} characters. Original length: ${jsonString.length}`
  };
}

/**
 * Format response with concise or detailed view
 */
export interface FormatOptions {
  format?: 'json' | 'markdown';
  detail?: 'concise' | 'detailed';
}

export function formatResponse(data: any, options: FormatOptions = {}): any {
  const { format = 'json', detail = 'detailed' } = options;

  if (detail === 'concise' && Array.isArray(data)) {
    // For arrays, show only essential fields
    data = data.map(item => {
      if (typeof item === 'object' && item !== null) {
        const { id, name, title, description, domain, ...rest } = item;
        return { id, name, title, description, domain };
      }
      return item;
    });
  }

  return truncateResponse(data);
}