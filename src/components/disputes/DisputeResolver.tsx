import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Heading, 
  Input, 
  Select, 
  Textarea, 
  VStack, 
  useToast,
  Text,
  Divider,
  HStack,
  Icon,
  InputGroup,
  InputRightElement,
  Tooltip
} from '@chakra-ui/react';
import { FiUpload, FiFile, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { 
  DisputeCategory, 
  DisputeSeverity,
  DisputeResolutionRequest,
  DisputeDetails
} from '../../lib/disputes/types';
import { Contact } from '../../lib/contacts/types';

interface DisputeResolverProps {
  contact: Contact;
}

const DisputeResolver: React.FC<DisputeResolverProps> = ({ contact }) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dispute, setDispute] = useState<DisputeDetails | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string>('');
  const [formData, setFormData] = useState<Partial<DisputeResolutionRequest>>({
    contactId: contact.id,
    category: DisputeCategory.COMMUNICATION_MISUNDERSTANDING,
    severity: DisputeSeverity.MEDIUM,
    description: '',
    context: '',
    desiredOutcome: ''
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      
      // Show file selected toast
      toast({
        title: 'File selected',
        description: `${file.name} will be used for additional context`,
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
    setIsLoading(true);

    try {
      // First upload the file if one is selected
      let filePath = '';
      if (uploadedFile) {
        const fileData = new FormData();
        fileData.append('file', uploadedFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: fileData,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          filePath = uploadResult.filePath;
          setUploadedFilePath(filePath);
        } else {
          console.error('File upload failed');
        }
      }
      
      // Then submit the dispute resolution request
      const response = await fetch('/api/disputes/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          uploadedFilePath: filePath || undefined
        }),
      });

      const result = await response.json();

      if (result.success && result.dispute) {
        setDispute(result.dispute);
        toast({
          title: 'Resolution strategy generated',
          description: 'A personalized dispute resolution strategy has been created.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to generate resolution strategy',
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
      console.error('Error generating resolution strategy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>Dispute Resolver</Heading>
      
      {!dispute ? (
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Dispute Category</FormLabel>
              <Select 
                name="category" 
                value={formData.category}
                onChange={handleInputChange}
              >
                {Object.entries(DisputeCategory).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Severity</FormLabel>
              <Select 
                name="severity" 
                value={formData.severity}
                onChange={handleInputChange}
              >
                {Object.entries(DisputeSeverity).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Description</FormLabel>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the dispute"
                rows={2}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Context</FormLabel>
              <Textarea
                name="context"
                value={formData.context}
                onChange={handleInputChange}
                placeholder="Provide context about the dispute situation"
                rows={3}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Desired Outcome</FormLabel>
              <Textarea
                name="desiredOutcome"
                value={formData.desiredOutcome}
                onChange={handleInputChange}
                placeholder="What outcome are you hoping to achieve?"
                rows={2}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>
                <HStack spacing={2}>
                  <Text>Additional Context File</Text>
                  <Tooltip label="Upload Excel, CSV, or text files with additional personality data or interaction history">
                    <Icon as={FiAlertCircle} color="blue.500" />
                  </Tooltip>
                </HStack>
              </FormLabel>
              <InputGroup>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv,.txt"
                  style={{ display: 'none' }}
                />
                <Input
                  readOnly
                  value={uploadedFile ? uploadedFile.name : 'No file selected'}
                  onClick={triggerFileUpload}
                  cursor="pointer"
                />
                <InputRightElement>
                  <Icon
                    as={uploadedFile ? FiCheckCircle : FiUpload}
                    color={uploadedFile ? 'green.500' : 'gray.500'}
                    onClick={triggerFileUpload}
                    cursor="pointer"
                  />
                </InputRightElement>
              </InputGroup>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Optional: Upload files with personality data or interaction history
              </Text>
            </FormControl>

            <Button 
              type="submit" 
              colorScheme="blue" 
              isLoading={isLoading}
              loadingText="Generating strategy..."
            >
              Generate Resolution Strategy
            </Button>
          </VStack>
        </form>
      ) : (
        <ResolutionDisplay dispute={dispute} onReset={() => setDispute(null)} />
      )}
    </Box>
  );
};

interface ResolutionDisplayProps {
  dispute: DisputeDetails;
  onReset: () => void;
}

const ResolutionDisplay: React.FC<ResolutionDisplayProps> = ({ dispute, onReset }) => {
  if (!dispute.resolutionStrategy) {
    return (
      <Box>
        <Text>No resolution strategy available.</Text>
        <Button mt={4} onClick={onReset}>Start Over</Button>
      </Box>
    );
  }

  const { resolutionStrategy } = dispute;

  return (
    <Box>
      <Heading size="sm" mb={2}>Resolution Strategy</Heading>
      <Text mb={4}>{resolutionStrategy.summary}</Text>
      
      <Heading size="sm" mb={2}>Approach Steps</Heading>
      {resolutionStrategy.approachSteps.map((step) => (
        <Box key={step.order} mb={3} p={3} borderWidth="1px" borderRadius="md">
          <Text fontWeight="bold">Step {step.order}: {step.action}</Text>
          <Text fontSize="sm" color="gray.600">Rationale: {step.rationale}</Text>
          {step.expectedResponse && (
            <Text fontSize="sm" color="blue.600">Expected Response: {step.expectedResponse}</Text>
          )}
        </Box>
      ))}
      
      <Divider my={4} />
      
      <Heading size="sm" mb={2}>Communication Tips</Heading>
      <VStack align="start" spacing={1} mb={4}>
        {resolutionStrategy.communicationTips.map((tip, index) => (
          <Text key={index}>• {tip}</Text>
        ))}
      </VStack>
      
      <Heading size="sm" mb={2}>Phrases to Use</Heading>
      <VStack align="start" spacing={1} mb={4}>
        {resolutionStrategy.phrasesToUse.map((phrase, index) => (
          <Text key={index}>✓ "{phrase}"</Text>
        ))}
      </VStack>
      
      <Heading size="sm" mb={2}>Phrases to Avoid</Heading>
      <VStack align="start" spacing={1} mb={4}>
        {resolutionStrategy.phrasesToAvoid.map((phrase, index) => (
          <Text key={index}>✗ "{phrase}"</Text>
        ))}
      </VStack>
      
      <Heading size="sm" mb={2}>Follow-up Recommendation</Heading>
      <Text mb={4}>{resolutionStrategy.followUpRecommendation}</Text>
      
      <Button mt={4} onClick={onReset}>Start New Dispute Resolution</Button>
    </Box>
  );
};

export default DisputeResolver;
