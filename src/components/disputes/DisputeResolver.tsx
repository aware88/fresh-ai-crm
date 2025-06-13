import React from 'react';
import { Contact } from '../../lib/contacts/types';

interface DisputeResolverProps {
  contact: Contact;
}

const DisputeResolver: React.FC<DisputeResolverProps> = ({ contact }) => {
  return (
    <div style={{ padding: '16px' }}>
      <h3>Dispute Resolution</h3>
      <p>
        Dispute resolution feature is temporarily unavailable during deployment optimization.
        This will be restored in the next update.
      </p>
    </div>
  );
};

export default DisputeResolver;
