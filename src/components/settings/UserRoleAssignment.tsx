import React, { useState, useEffect } from 'react';
import { RoleService, Role, UserRole } from '@/lib/services/role-service';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '../permissions/PermissionGate';

// Import custom UI components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';


interface User {
  id: string;
  email: string;
  name?: string;
}

export default function UserRoleAssignment({ 
  organizationId, 
  users 
}: { 
  organizationId: string;
  users: User[];
}) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  
  // Form state
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch roles and user roles
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const roleService = new RoleService();
        
        // Fetch roles for this organization (and system roles)
        const rolesData = await roleService.getRoles(organizationId);
        setRoles(rolesData);
        
        // Fetch roles for each user
        const userRolesMap: Record<string, UserRole[]> = {};
        
        for (const user of users) {
          const userRolesData = await roleService.getUserRoles(user.id, organizationId);
          userRolesMap[user.id] = userRolesData;
        }
        
        setUserRoles(userRolesMap);
      } catch (error) {
        console.error('Error fetching roles and user roles:', error);
        toast({
          title: 'Error',
          description: 'Failed to load roles and user assignments',
          variant: 'destructive',
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    }
    
    if (users.length > 0) {
      fetchData();
    }
  }, [organizationId, users, toast]);
  
  // Handle user selection for role assignment
  const handleAssignRole = (user: User) => {
    setSelectedUser(user);
    setSelectedRoleId('');
    onOpen();
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedRoleId || !selectedUser) {
      toast({
        title: 'Error',
        description: 'Please select a role to assign',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const roleService = new RoleService();
      
      // Assign role to user
      await roleService.assignRoleToUser(selectedUser.id, selectedRoleId);
      
      // Refresh user roles
      const updatedUserRoles = await roleService.getUserRoles(selectedUser.id, organizationId);
      setUserRoles(prev => ({
        ...prev,
        [selectedUser.id]: updatedUserRoles
      }));
      
      toast({
        title: 'Success',
        description: 'Role assigned successfully',
        variant: 'success',
        duration: 3000,
      });
      
      onClose();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle role revocation
  const handleRevokeRole = async (userId: string, roleId: string) => {
    if (!confirm('Are you sure you want to revoke this role from the user?')) {
      return;
    }
    
    try {
      const roleService = new RoleService();
      await roleService.revokeRoleFromUser(userId, roleId);
      
      // Refresh user roles
      const updatedUserRoles = await roleService.getUserRoles(userId, organizationId);
      setUserRoles(prev => ({
        ...prev,
        [userId]: updatedUserRoles
      }));
      
      toast({
        title: 'Success',
        description: 'Role revoked successfully',
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error revoking role:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke role',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-4">User Role Assignment</h2>
      
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-sm font-semibold">Organization Members</h3>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found in this organization.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {userRoles[user.id]?.map(userRole => (
                        <div key={userRole.id} className="flex items-center mb-1">
                          <span className="text-sm">{userRole.role?.name}</span>
                          <PermissionGate resourceType="role" action="assign">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="ml-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleRevokeRole(user.id, userRole.role_id)}
                              disabled={session?.user?.id === user.id} // Prevent revoking your own roles
                            >
                              Revoke
                            </Button>
                          </PermissionGate>
                        </div>
                      )) || 'No roles assigned'}
                    </TableCell>
                    <TableCell>
                      <PermissionGate resourceType="role" action="assign">
                        <Button 
                          size="sm" 
                          variant="default" 
                          onClick={() => handleAssignRole(user)}
                        >
                          Assign Role
                        </Button>
                      </PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Role Assignment Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign Role to {selectedUser?.name || selectedUser?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-sm">Select a role to assign to this user:</p>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name} {role.is_system_role ? '(System)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" className="mr-2" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleSubmit} 
              disabled={!selectedRoleId || isSubmitting}
              className={isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Assigning...
                </>
              ) : (
                'Assign Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
