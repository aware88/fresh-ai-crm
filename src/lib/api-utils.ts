/**
 * Utility functions for API calls
 */

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Handle API errors consistently
 * @param error Error to handle
 * @returns NextResponse with appropriate error status and message
 */
export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Handle other types of errors
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return new Response(
    JSON.stringify({ error: message }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}

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
