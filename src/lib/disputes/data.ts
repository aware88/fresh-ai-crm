import { v4 as uuidv4 } from 'uuid';
import { 
  DisputeDetails, 
  DisputeResolutionRequest, 
  DisputeStatus,
  ResolutionStrategy 
} from './types';
import { getContactById } from '../contacts/data';

// Cache disputes in memory to reduce API calls
let disputesCache: DisputeDetails[] | null = null;

/**
 * Load disputes from API
 */
export async function loadDisputes(): Promise<DisputeDetails[]> {
  try {
    // Return cached disputes if available
    if (disputesCache) {
      return disputesCache;
    }
    
    // Fetch disputes from API
    const response = await fetch('/api/disputes');
    if (!response.ok) {
      throw new Error('Failed to load disputes');
    }
    
    const data = await response.json();
    disputesCache = data;
    return data;
  } catch (error) {
    console.error('Error loading disputes:', error);
    return [];
  }
}

/**
 * Save disputes via API
 */
async function saveDisputes(disputes: DisputeDetails[]): Promise<boolean> {
  try {
    const response = await fetch('/api/disputes/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(disputes),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save disputes');
    }
    
    // Update cache
    disputesCache = disputes;
    return true;
  } catch (error) {
    console.error('Error saving disputes:', error);
    return false;
  }
}

/**
 * Create a new dispute
 */
export async function createDispute(disputeData: DisputeResolutionRequest): Promise<DisputeDetails | null> {
  try {
    // Verify contact exists
    const contact = await getContactById(disputeData.contactId);
    if (!contact) {
      console.error(`Contact with ID ${disputeData.contactId} not found`);
      return null;
    }
    
    const disputes = await loadDisputes();
    
    const newDispute: DisputeDetails = {
      id: uuidv4(),
      contactId: disputeData.contactId,
      category: disputeData.category,
      severity: disputeData.severity,
      status: DisputeStatus.OPEN,
      description: disputeData.description,
      context: disputeData.context,
      desiredOutcome: disputeData.desiredOutcome,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    disputes.push(newDispute);
    await saveDisputes(disputes);
    
    return newDispute;
  } catch (error) {
    console.error('Error creating dispute:', error);
    return null;
  }
}

/**
 * Get disputes for a specific contact
 */
export async function getDisputesByContactId(contactId: string): Promise<DisputeDetails[]> {
  try {
    const disputes = await loadDisputes();
    return disputes.filter(d => d.contactId === contactId);
  } catch (error) {
    console.error('Error getting disputes by contact ID:', error);
    return [];
  }
}

/**
 * Get a dispute by ID
 */
export async function getDisputeById(id: string): Promise<DisputeDetails | null> {
  try {
    const disputes = await loadDisputes();
    const dispute = disputes.find(d => d.id === id);
    return dispute || null;
  } catch (error) {
    console.error('Error getting dispute by ID:', error);
    return null;
  }
}

/**
 * Update a dispute with resolution strategy
 */
export async function updateDisputeWithResolution(
  disputeId: string, 
  resolutionStrategy: ResolutionStrategy
): Promise<DisputeDetails | null> {
  try {
    const disputes = await loadDisputes();
    const index = disputes.findIndex(d => d.id === disputeId);
    
    if (index === -1) {
      console.warn(`Dispute with ID ${disputeId} not found`);
      return null;
    }
    
    const updatedDispute: DisputeDetails = {
      ...disputes[index],
      status: DisputeStatus.IN_PROGRESS,
      resolutionStrategy,
      updatedAt: new Date().toISOString()
    };
    
    disputes[index] = updatedDispute;
    await saveDisputes(disputes);
    
    return updatedDispute;
  } catch (error) {
    console.error('Error updating dispute with resolution:', error);
    return null;
  }
}

/**
 * Update dispute status
 */
export async function updateDisputeStatus(
  disputeId: string, 
  status: DisputeStatus,
  resolutionNotes?: string
): Promise<DisputeDetails | null> {
  try {
    const disputes = await loadDisputes();
    const index = disputes.findIndex(d => d.id === disputeId);
    
    if (index === -1) {
      console.warn(`Dispute with ID ${disputeId} not found`);
      return null;
    }
    
    const updatedDispute: DisputeDetails = {
      ...disputes[index],
      status,
      updatedAt: new Date().toISOString(),
      // If status is resolved, add resolved timestamp
      ...(status === DisputeStatus.RESOLVED ? { resolvedAt: new Date().toISOString() } : {}),
      // Add resolution notes if provided
      ...(resolutionNotes ? { resolutionNotes } : {})
    };
    
    disputes[index] = updatedDispute;
    await saveDisputes(disputes);
    
    return updatedDispute;
  } catch (error) {
    console.error('Error updating dispute status:', error);
    return null;
  }
}
