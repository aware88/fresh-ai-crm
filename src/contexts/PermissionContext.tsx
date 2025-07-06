import React, { createContext, useContext, ReactNode } from 'react';
import { usePermissions, Permission } from '../hooks/usePermissions';

interface PermissionContextType {
  permissions: Permission[];
  loading: boolean;
  error: Error | null;
  hasPermission: (permissionString: string) => boolean;
  hasAnyPermission: (permissionStrings: string[]) => boolean;
  hasAllPermissions: (permissionStrings: string[]) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

/**
 * Provider component that makes permission data available to any
 * child component that calls usePermissionContext().
 */
export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const permissionData = usePermissions();
  
  return (
    <PermissionContext.Provider value={permissionData}>
      {children}
    </PermissionContext.Provider>
  );
};

/**
 * Hook that lets any component easily access the permission context.
 */
export const usePermissionContext = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  
  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  
  return context;
};
