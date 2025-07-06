'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Plus, Loader2, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Role {
  id: string;
  name: string;
  type: string;
}

interface UserRolesProps {
  userId: string;
  initialRoles: Role[];
}

export default function UserRoles({ userId, initialRoles }: UserRolesProps) {
  const [roles, setRoles] = useState<Role[]>(initialRoles || []);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available roles
  useEffect(() => {
    async function fetchAvailableRoles() {
      try {
        const response = await fetch('/api/admin/roles');
        
        if (!response.ok) {
          throw new Error('Failed to fetch roles');
        }
        
        const data = await response.json();
        // Filter out roles the user already has
        const userRoleIds = new Set(roles.map(role => role.id));
        const available = (data.roles || []).filter(
          (role: Role) => !userRoleIds.has(role.id)
        );
        setAvailableRoles(available);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }
    
    fetchAvailableRoles();
  }, [roles]);

  const handleAddRole = async () => {
    if (!selectedRoleId) return;
    
    setIsAdding(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role_id: selectedRoleId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add role');
      }
      
      const data = await response.json();
      
      // Find the role in availableRoles and add it to roles
      const addedRole = availableRoles.find(role => role.id === selectedRoleId);
      if (addedRole) {
        setRoles([...roles, addedRole]);
      }
      
      // Reset selection
      setSelectedRoleId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/roles/${roleId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove role');
      }
      
      // Remove the role from the list
      setRoles(roles.filter(role => role.id !== roleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  function getRoleBadgeColor(type: string): string {
    switch (type.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-blue-100 text-blue-800';
      case 'organization':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Roles</CardTitle>
        <CardDescription>
          Manage the roles assigned to this user. Roles determine what permissions the user has.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.length === 0 ? (
                    <SelectItem value="no-roles" disabled>
                      No more roles available
                    </SelectItem>
                  ) : (
                    availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAddRole} 
              disabled={!selectedRoleId || isAdding}
              className="flex items-center gap-2"
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Role
                </>
              )}
            </Button>
          </div>
        </div>

        {roles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            This user has no roles assigned.
          </div>
        ) : (
          <div className="space-y-4">
            {roles.map((role) => (
              <div 
                key={role.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <div className="font-medium">{role.name}</div>
                  <div className="mt-1">
                    <Badge className={getRoleBadgeColor(role.type)}>
                      {role.type}
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveRole(role.id)}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
