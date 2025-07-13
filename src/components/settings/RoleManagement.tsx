import React, { useState, useEffect } from 'react';

// Import custom UI components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { RoleService, Role, Permission } from '@/lib/services/role-service';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '../permissions/PermissionGate';

export default function RoleManagement({ organizationId }: { organizationId: string }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  
  // Form state
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch roles and permissions
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const roleService = new RoleService();
        
        // Fetch roles for this organization (and system roles)
        const rolesData = await roleService.getRoles(organizationId);
        setRoles(rolesData);
        
        // Fetch all permissions
        const permissionsData = await roleService.getAllPermissions();
        setPermissions(permissionsData);
      } catch (error) {
        console.error('Error fetching roles and permissions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load roles and permissions',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [organizationId, toast]);
  
  // Group permissions by resource type
  const permissionsByResource = permissions.reduce<Record<string, Permission[]>>((acc, permission) => {
    if (!acc[permission.resource_type]) {
      acc[permission.resource_type] = [];
    }
    acc[permission.resource_type].push(permission);
    return acc;
  }, {});
  
  // Handle role selection
  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    
    // Set selected permissions
    const permissionIds = new Set<string>();
    role.permissions?.forEach(permission => {
      permissionIds.add(permission.id);
    });
    setSelectedPermissions(permissionIds);
    
    onOpen();
  };
  
  // Handle new role
  const handleNewRole = () => {
    setSelectedRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions(new Set());
    onOpen();
  };
  
  // Handle permission toggle
  const handlePermissionToggle = (permissionId: string) => {
    const newSelectedPermissions = new Set(selectedPermissions);
    
    if (newSelectedPermissions.has(permissionId)) {
      newSelectedPermissions.delete(permissionId);
    } else {
      newSelectedPermissions.add(permissionId);
    }
    
    setSelectedPermissions(newSelectedPermissions);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!roleName.trim()) {
      toast({
        title: 'Error',
        description: 'Role name is required',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const roleService = new RoleService();
      const permissionIdsArray = Array.from(selectedPermissions);
      
      if (selectedRole) {
        // Update existing role
        await roleService.updateRole(
          selectedRole.id,
          roleName,
          roleDescription || null,
          permissionIdsArray
        );
        
        toast({
          title: 'Success',
          description: `Role "${roleName}" updated successfully`,
          variant: 'success',
        });
      } else {
        // Create new role
        await roleService.createRole(
          roleName,
          roleDescription || null,
          organizationId,
          permissionIdsArray
        );
        
        toast({
          title: 'Success',
          description: selectedRole ? 'Role updated successfully' : 'Role created successfully',
          variant: 'success',
        });
      }
      
      // Refresh roles
      const updatedRoles = await roleService.getRoles(organizationId);
      setRoles(updatedRoles);
      
      onClose();
    } catch (error) {
      console.error('Error saving role:', error);
      toast({
        title: 'Error',
        description: 'Failed to save role',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle role deletion
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }
    
    try {
      const roleService = new RoleService();
      await roleService.deleteRole(roleId);
      
      // Refresh roles
      const updatedRoles = await roleService.getRoles(organizationId);
      setRoles(updatedRoles);
      
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        variant: 'destructive',
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
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Role Management</h2>
          <PermissionGate resourceType="role" action="create">
            <Button variant="default" onClick={handleNewRole}>
              Create New Role
            </Button>
          </PermissionGate>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map(role => (
                  <TableRow key={role.id}>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>{role.description || 'No description'}</TableCell>
                    <TableCell>{role.is_system_role ? 'System' : 'Custom'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <PermissionGate resourceType="role" action="update">
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={() => handleSelectRole(role)}
                          >
                            {role.is_system_role ? 'View' : 'Edit'}
                          </Button>
                        </PermissionGate>
                        
                        <PermissionGate resourceType="role" action="delete">
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteRole(role.id)}
                            disabled={role.is_system_role}
                          >
                            Delete
                          </Button>
                        </PermissionGate>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Role Edit/Create Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? `Edit Role: ${selectedRole.name}` : 'Create New Role'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input 
                id="roleName"
                value={roleName} 
                onChange={(e) => setRoleName(e.target.value)} 
                placeholder="Enter role name"
                disabled={selectedRole?.is_system_role}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea 
                id="roleDescription"
                value={roleDescription} 
                onChange={(e) => setRoleDescription(e.target.value)} 
                placeholder="Enter role description"
                disabled={selectedRole?.is_system_role}
                className="w-full"
              />
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <h3 className="text-sm font-semibold mb-2">Permissions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select the permissions to assign to this role.
              </p>
              
              {Object.entries(permissionsByResource).map(([resourceType, resourcePermissions]) => (
                <div key={resourceType} className="mb-4">
                  <h4 className="text-xs font-semibold capitalize mb-2">
                    {resourceType}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {resourcePermissions.map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`permission-${permission.id}`}
                          checked={selectedPermissions.has(permission.id)}
                          onCheckedChange={() => handlePermissionToggle(permission.id)}
                          disabled={selectedRole?.is_system_role}
                        />
                        <Label htmlFor={`permission-${permission.id}`} className="text-sm">
                          {permission.name}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({permission.action})
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose} className="mr-2">
              Cancel
            </Button>
            <PermissionGate
              resourceType="role"
              action={selectedRole ? 'update' : 'create'}
              fallback={<Button variant="default" onClick={onClose}>Close</Button>}
            >
              <Button 
                variant="default" 
                onClick={handleSubmit} 
                disabled={isSubmitting || selectedRole?.is_system_role}
                className={isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {selectedRole ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  selectedRole ? 'Update Role' : 'Create Role'
                )}
              </Button>
            </PermissionGate>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
