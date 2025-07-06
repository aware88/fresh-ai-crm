import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { RoleService, Role, Permission } from '@/lib/services/role-service';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '../permissions/PermissionGate';

export default function RoleManagement({ organizationId }: { organizationId: string }) {
  const { data: session } = useSession();
  const toast = useToast();
  const { hasPermission } = usePermissions();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
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
          status: 'error',
          duration: 5000,
          isClosable: true,
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
        status: 'error',
        duration: 3000,
        isClosable: true,
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
          status: 'success',
          duration: 3000,
          isClosable: true,
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
          description: `Role "${roleName}" created successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
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
        description: `Failed to ${selectedRole ? 'update' : 'create'} role`,
        status: 'error',
        duration: 5000,
        isClosable: true,
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
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  if (loading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Role Management</Heading>
        <PermissionGate resourceType="role" action="create">
          <Button colorScheme="blue" onClick={handleNewRole}>
            Create New Role
          </Button>
        </PermissionGate>
      </Flex>
      
      <Card variant="outline" mb={6}>
        <CardHeader>
          <Heading size="sm">Organization Roles</Heading>
        </CardHeader>
        <CardBody>
          {roles.length === 0 ? (
            <Text>No custom roles found. Create your first role to get started.</Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Role Name</Th>
                  <Th>Description</Th>
                  <Th>Type</Th>
                  <Th>Permissions</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {roles.map(role => (
                  <Tr key={role.id}>
                    <Td>{role.name}</Td>
                    <Td>{role.description || '-'}</Td>
                    <Td>{role.is_system_role ? 'System' : 'Custom'}</Td>
                    <Td>{role.permissions?.length || 0}</Td>
                    <Td>
                      <Flex gap={2}>
                        <PermissionGate 
                          resourceType="role" 
                          action="update"
                          fallback={<Button size="sm" onClick={() => handleSelectRole(role)} isDisabled={role.is_system_role}>View</Button>}
                        >
                          <Button 
                            size="sm" 
                            onClick={() => handleSelectRole(role)}
                            isDisabled={role.is_system_role}
                          >
                            Edit
                          </Button>
                        </PermissionGate>
                        
                        <PermissionGate resourceType="role" action="delete">
                          <Button 
                            size="sm" 
                            colorScheme="red" 
                            onClick={() => handleDeleteRole(role.id)}
                            isDisabled={role.is_system_role}
                          >
                            Delete
                          </Button>
                        </PermissionGate>
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>
      
      {/* Role Edit/Create Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedRole ? `Edit Role: ${selectedRole.name}` : 'Create New Role'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Role Name</FormLabel>
                <Input 
                  value={roleName} 
                  onChange={(e) => setRoleName(e.target.value)} 
                  placeholder="Enter role name"
                  isReadOnly={selectedRole?.is_system_role}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea 
                  value={roleDescription} 
                  onChange={(e) => setRoleDescription(e.target.value)} 
                  placeholder="Enter role description"
                  isReadOnly={selectedRole?.is_system_role}
                />
              </FormControl>
              
              <Divider my={4} />
              
              <Heading size="sm">Permissions</Heading>
              <Text fontSize="sm" color="gray.600">
                Select the permissions to assign to this role.
              </Text>
              
              {Object.entries(permissionsByResource).map(([resourceType, resourcePermissions]) => (
                <Box key={resourceType} mb={4}>
                  <Heading size="xs" textTransform="capitalize" mb={2}>
                    {resourceType}
                  </Heading>
                  <SimpleGrid columns={2} spacing={2}>
                    {resourcePermissions.map(permission => (
                      <Checkbox 
                        key={permission.id}
                        isChecked={selectedPermissions.has(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        isDisabled={selectedRole?.is_system_role}
                      >
                        <Text fontSize="sm">
                          {permission.name}
                          <Text as="span" fontSize="xs" color="gray.500" ml={1}>
                            ({permission.action})
                          </Text>
                        </Text>
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </Box>
              ))}
            </Stack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <PermissionGate
              resourceType="role"
              action={selectedRole ? 'update' : 'create'}
              fallback={<Button colorScheme="blue" onClick={onClose}>Close</Button>}
            >
              <Button 
                colorScheme="blue" 
                onClick={handleSubmit} 
                isLoading={isSubmitting}
                isDisabled={selectedRole?.is_system_role}
              >
                {selectedRole ? 'Update Role' : 'Create Role'}
              </Button>
            </PermissionGate>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
