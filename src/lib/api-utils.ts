/**
 * Utility functions for API calls
 */

/**
 * Fetch with error handling
 * @param url URL to fetch
 * @param options Fetch options
 * @returns Response data
 */
export async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  // Ensure headers are set
  if (!options.headers) {
    options.headers = {
      'Content-Type': 'application/json',
    };
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
      } catch (parseError) {
        // If we can't parse the error response, throw a generic error
        throw new Error(`API error: ${response.status}`);
      }
    }
    
    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
