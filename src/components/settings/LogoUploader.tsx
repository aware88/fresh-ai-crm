import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Image,
  Input,
  Text,
  VStack,
  useToast,
  HStack,
  Icon,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react';
import { FiUpload, FiCheckCircle, FiImage } from 'react-icons/fi';

const LogoUploader: React.FC = () => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);

  // Fetch current logo on component mount
  React.useEffect(() => {
    const fetchCurrentLogo = async () => {
      try {
        const response = await fetch('/api/logo/get');
        if (response.ok) {
          const data = await response.json();
          if (data.logoPath) {
            setCurrentLogo(data.logoPath);
          }
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    };

    fetchCurrentLogo();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PNG, JPEG, or SVG file.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      setLogoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: 'File selected',
        description: `${file.name} is ready to upload`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!logoFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a logo file to upload.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      
      const response = await fetch('/api/logo/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setCurrentLogo(result.logoPath);
        setPreviewUrl(null);
        setLogoFile(null);
        
        toast({
          title: 'Logo uploaded',
          description: 'Your company logo has been updated successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Reload the page to show the new logo in the navigation
        window.location.reload();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to upload logo',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error uploading logo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>Company Logo</Heading>
      
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          {currentLogo && !previewUrl && (
            <Box textAlign="center" mb={4}>
              <Text mb={2}>Current Logo:</Text>
              <Image 
                src={currentLogo} 
                alt="Company Logo" 
                maxH="100px" 
                mx="auto"
                borderRadius="md"
              />
            </Box>
          )}
          
          {previewUrl && (
            <Box textAlign="center" mb={4}>
              <Text mb={2}>Preview:</Text>
              <Image 
                src={previewUrl} 
                alt="Logo Preview" 
                maxH="100px" 
                mx="auto"
                borderRadius="md"
              />
            </Box>
          )}
          
          <FormControl>
            <FormLabel>Upload New Logo</FormLabel>
            <InputGroup>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".png,.jpg,.jpeg,.svg"
                style={{ display: 'none' }}
              />
              <Input
                readOnly
                value={logoFile ? logoFile.name : 'No file selected'}
                onClick={triggerFileUpload}
                cursor="pointer"
              />
              <InputRightElement>
                <Icon
                  as={logoFile ? FiCheckCircle : FiUpload}
                  color={logoFile ? 'green.500' : 'gray.500'}
                  onClick={triggerFileUpload}
                  cursor="pointer"
                />
              </InputRightElement>
            </InputGroup>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Recommended: PNG or SVG file with transparent background, max 5MB
            </Text>
          </FormControl>

          <HStack spacing={4} justify="flex-end">
            {previewUrl && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setPreviewUrl(null);
                  setLogoFile(null);
                }}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              colorScheme="blue" 
              isLoading={isLoading}
              loadingText="Uploading..."
              isDisabled={!logoFile}
              leftIcon={<FiImage />}
            >
              Upload Logo
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  );
};

export default LogoUploader;
