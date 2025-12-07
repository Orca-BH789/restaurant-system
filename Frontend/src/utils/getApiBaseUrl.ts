/**
 * Get the appropriate API base URL based on environment
 * Uses VITE_API_BASE_URL_PROD for all environments
 */
export const getApiBaseUrl = (): string => {
  // Always use production URL or fallback
  return import.meta.env.VITE_API_BASE_URL_PROD || 'https://webdemocuahangtraicay.io.vn/core/api';
};
       //http://localhost:5211
/**
 * Inline version for direct use
 * Usage: const url = `${getApiBaseUrl()}/Categories`
 */
export default getApiBaseUrl;
