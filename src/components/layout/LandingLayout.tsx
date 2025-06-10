import React, { ReactNode } from 'react';
import { Navigation } from './Navigation';

interface LandingLayoutProps {
  children: ReactNode;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default LandingLayout;
