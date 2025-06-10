export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  personalityType?: string;
  personalityNotes?: string;
  notes?: string;
  lastContact?: string;
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
