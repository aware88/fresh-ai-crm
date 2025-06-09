export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  personalityType?: string;
  personalityNotes?: string;
  lastInteraction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  personalityType?: string;
  personalityNotes?: string;
}

export interface ContactUpdateInput {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  personalityType?: string;
  personalityNotes?: string;
}
