import React from 'react';
import LogoUploader from '../../components/settings/LogoUploader';
import CompanyWebsiteScanner from '../../components/settings/CompanyWebsiteScanner';

const SettingsPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1>Settings</h1>
        <p style={{ color: '#666' }}>
          Customize your AI CRM system settings
        </p>
      </div>

      <div style={{ display: 'grid', gap: '32px' }}>
        <LogoUploader />
        <CompanyWebsiteScanner />
      </div>
    </div>
  );
};

export default SettingsPage;
