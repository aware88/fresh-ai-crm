/**
 * Auth module exports
 * 
 * This file exports all auth-related functions from various modules
 * to simplify imports throughout the application.
 */

// Import and re-export session utilities
import * as sessionModule from './session';
export const getSession = sessionModule.getSession;
export const getUID = sessionModule.getUID;

// Import and re-export service token utilities
import * as tokenModule from './serviceToken';
export const validateServiceToken = tokenModule.validateServiceToken;
export const generateServiceToken = tokenModule.generateServiceToken;
