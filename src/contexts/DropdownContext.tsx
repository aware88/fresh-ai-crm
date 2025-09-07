'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface DropdownContextType {
  activeDropdown: string | null;
  setActiveDropdown: (id: string | null) => void;
  registerDropdown: (id: string) => void;
  unregisterDropdown: (id: string) => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

export function DropdownProvider({ children }: { children: React.ReactNode }) {
  const [activeDropdown, setActiveDropdownState] = useState<string | null>(null);
  const [registeredDropdowns] = useState(new Set<string>());

  const setActiveDropdown = useCallback((id: string | null) => {
    setActiveDropdownState(id);
  }, []);

  const registerDropdown = useCallback((id: string) => {
    registeredDropdowns.add(id);
  }, [registeredDropdowns]);

  const unregisterDropdown = useCallback((id: string) => {
    registeredDropdowns.delete(id);
    if (activeDropdown === id) {
      setActiveDropdownState(null);
    }
  }, [registeredDropdowns, activeDropdown]);

  return (
    <DropdownContext.Provider 
      value={{ 
        activeDropdown, 
        setActiveDropdown, 
        registerDropdown, 
        unregisterDropdown 
      }}
    >
      {children}
    </DropdownContext.Provider>
  );
}

export function useDropdown() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('useDropdown must be used within a DropdownProvider');
  }
  return context;
}