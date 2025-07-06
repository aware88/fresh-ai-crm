import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { RoleService, Role, UserRole } from '@/lib/services/role-service';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '../permissions/PermissionGate';

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
  const toast = useToast();
  const { hasPermission } = usePermissions();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
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
          status: 'error',
          duration: 5000,
          isClosable: true,
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
        status: 'error',
        duration: 3000,
        isClosable: true,
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
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        status: 'error',
        duration: 5000,
        isClosable: true,
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
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error revoking role:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke role',
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
      <Heading size="md" mb={4}>User Role Assignment</Heading>
      
      <Card variant="outline" mb={6}>
        <CardHeader>
          <Heading size="sm">Organization Members</Heading>
        </CardHeader>
        <CardBody>
          {users.length === 0 ? (
            <Text>No users found in this organization.</Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>User</Th>
                  <Th>Email</Th>
                  <Th>Assigned Roles</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map(user => (
                  <Tr key={user.id}>
                    <Td>{user.name || 'N/A'}</Td>
                    <Td>{user.email}</Td>
                    <Td>
                      {userRoles[user.id]?.map(userRole => (
                        <Flex key={userRole.id} align="center" mb={1}>
                          <Text fontSize="sm">{userRole.role?.name}</Text>
                          <PermissionGate resourceType="role" action="assign">
                            <Button 
                              size="xs" 
                              colorScheme="red" 
                              variant="ghost" 
                              ml={2}
                              onClick={() => handleRevokeRole(user.id, userRole.role_id)}
                              isDisabled={session?.user?.id === user.id} // Prevent revoking your own roles
                            >
                              Revoke
                            </Button>
                          </PermissionGate>
                        </Flex>
                      )) || 'No roles assigned'}
                    </Td>
                    <Td>
                      <PermissionGate resourceType="role" action="assign">
                        <Button 
                          size="sm" 
                          colorScheme="blue" 
                          onClick={() => handleAssignRole(user)}
                        >
                          Assign Role
                        </Button>
                      </PermissionGate>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>
      
      {/* Role Assignment Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Assign Role to {selectedUser?.name || selectedUser?.email}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>Select a role to assign to this user:</Text>
            <Select 
              value={selectedRoleId} 
              onChange={(e) => setSelectedRoleId(e.target.value)}
              placeholder="Select a role"
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name} {role.is_system_role ? '(System)' : ''}
                </option>
              ))}
            </Select>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSubmit} 
              isLoading={isSubmitting}
              isDisabled={!selectedRoleId}
            >
              Assign Role
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
