import React from 'react';
import { Contact } from '../../lib/contacts/types';

interface DisputeHistoryProps {
  contact: Contact;
}

const DisputeHistory: React.FC<DisputeHistoryProps> = ({ contact }) => {
  return (
    <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
      <h3>Dispute History</h3>
      <p>
        Dispute history feature is temporarily unavailable during deployment optimization.
        This will be restored in the next update.
      </p>
    </div>
  );
};

export default DisputeHistory;
