import React from 'react';
import DisputeResolver from './DisputeResolver';
import { Contact } from '../../lib/contacts/types';

interface DisputeTabProps {
  contact: Contact;
}

const DisputeTab: React.FC<DisputeTabProps> = ({ contact }) => {
  return (
    <div style={{ padding: '16px' }}>
      <DisputeResolver contact={contact} />
    </div>
  );
};

export default DisputeTab;
