/**
 * Service token authentication utility for service-to-service API calls
 * Used for authenticating automated processes like document processing
 */

/**
 * Validates a service token against the environment variable
 * @param token The token to validate
 * @returns True if the token is valid, false otherwise
 */
export function validateServiceToken(token: string): boolean {
  const validToken = process.env.SERVICE_TOKEN;
  
  if (!validToken) {
    console.warn('SERVICE_TOKEN environment variable is not set');
    return false;
  }
  
  return token === validToken;
}

/**
 * Generates a service token for testing purposes
 * In production, this should be a secure random string set as an environment variable
 * @returns A new service token
 */
export function generateServiceToken(): string {
  return crypto.randomUUID();
}

/**
 * Gets the service token from environment variables
 * @returns The service token or null if not set
 */
export function getServiceToken(): string | null {
  const token = process.env.SERVICE_TOKEN;
  if (!token) {
    console.warn('SERVICE_TOKEN environment variable is not set');
    return null;
  }
  return token;
}
