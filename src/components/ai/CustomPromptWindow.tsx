'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, Check, Brain, AlertCircle, Database, User, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadContacts } from '@/lib/contacts/data';
import { Contact } from '@/lib/contacts/types';

type AIResponse = {
  content: string;
  timestamp: string;
};

export function CustomPromptWindow() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [includeContactData, setIncludeContactData] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Mock contacts for fallback when API fails
  const mockContacts: Contact[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-1234',
      company: 'Acme Inc',
      position: 'CEO',
      personalityType: 'Analytical',
      notes: 'Key decision maker',
      lastContact: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-5678',
      company: 'Tech Solutions',
      position: 'CTO',
      personalityType: 'Driver',
      notes: 'Technical background',
      lastContact: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'michael.j@example.com',
      phone: '555-9012',
      company: 'Global Corp',
      position: 'Sales Director',
      personalityType: 'Expressive',
      notes: 'Prefers phone calls over emails',
      lastContact: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Fetch real contacts from the CRM system
  useEffect(() => {
    const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
        // Load contacts from the CRM data module
        const contactsData = await loadContacts();
        
        // Check if we got valid contacts data
        if (contactsData && Array.isArray(contactsData) && contactsData.length > 0) {
          setContacts(contactsData);
        } else {
          // Fall back to mock data if no contacts were returned
          console.log('No contacts found, using mock data');
          setContacts(mockContacts);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        // Fall back to mock data on error
        setContacts(mockContacts);
        toast({
          title: "Using sample contacts",
          description: "Could not load real contact data. Using sample data instead.",
          variant: "default"
        });
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, [toast]);

  // Templates for different use cases
  const templates = {
    general: '',
    dispute: 'I need help resolving a dispute with a customer. Here are the details:\n\nCustomer complaint: \n\nOur position: \n\nRelevant policies: \n\nDesired outcome: ',
    email: 'Please help me craft a professional email response to the following message:\n\n',
    analysis: 'Please analyze the following information and provide insights:\n\n'
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPrompt(templates[value as keyof typeof templates]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      // Prepare the prompt with contact data if selected
      let finalPrompt = prompt;
      
      if (includeContactData && selectedContact) {
        const contact = contacts.find((c: Contact) => c.id === selectedContact);
        if (contact) {
          const contactData = `
CONTACT DATA:
Name: ${contact.firstName} ${contact.lastName}
Email: ${contact.email}
Company: ${contact.company || 'N/A'}
Position: ${contact.position || 'N/A'}
Personality: ${contact.personalityType || 'Unknown'}
Notes: ${contact.personalityNotes || contact.notes || 'No additional notes'}
Last Contact: ${contact.lastContact || 'Unknown'}
`;
          finalPrompt = `${contactData}

${prompt}`;
        }
      }

      const response = await fetch('/api/custom-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: finalPrompt }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }
      
      const data = await response.json();
      
      setResponse({
        content: data.content,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      setError('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response.content);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Response has been copied to your clipboard",
      });
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  const formatResponse = (text: string) => {
    // Convert markdown-like formatting to HTML
    return text
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*?)$/gm, '<h3 class="text-xl font-bold my-2">$1</h3>')
      .replace(/^## (.*?)$/gm, '<h4 class="text-lg font-bold my-2">$1</h4>')
      .replace(/^### (.*?)$/gm, '<h5 class="text-md font-bold my-2">$1</h5>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded my-2 overflow-x-auto"><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/- (.*?)$/gm, '• $1<br/>');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 p-1 bg-blue-50 rounded-xl shadow-inner border border-blue-100">
          <TabsTrigger 
            value="general" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <Brain className="h-4 w-4" />
            General Assistant
          </TabsTrigger>
          <TabsTrigger 
            value="dispute" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <AlertCircle className="h-4 w-4" />
            Dispute Resolution
          </TabsTrigger>
          <TabsTrigger 
            value="email" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <FileText className="h-4 w-4" />
            Email Assistance
          </TabsTrigger>
          <TabsTrigger 
            value="analysis" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <Database className="h-4 w-4" />
            Data Analysis
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <CardTitle>AI Assistant</CardTitle>
          </div>
          <CardDescription>
            Ask any question or request assistance with contact disputes, emails, or data analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Textarea
                placeholder="Enter your prompt here..."
                className="min-h-[150px] resize-y"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              {error && (
                <div className="flex items-center mt-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {error}
                </div>
              )}
            </div>
            
            {/* Contact Data Integration */}
            {activeTab === 'dispute' && (
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <div className="flex items-center space-x-2 mb-3">
                  <Database className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-medium text-blue-700">Contact Data Integration</h3>
                </div>
                
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground">
                      {includeContactData && <Check className="h-3 w-3" />}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIncludeContactData(!includeContactData)}
                      className="text-sm text-gray-700"
                    >
                      Include contact context in prompt
                    </button>
                  </div>
                </div>
                
                {includeContactData && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-blue-700 mb-1">Select a contact</label>
                    <Select 
                      value={selectedContact} 
                      onValueChange={setSelectedContact}
                      disabled={loadingContacts}
                    >
                      <SelectTrigger className="w-full bg-white border-blue-200 hover:border-blue-400 focus:border-blue-500 shadow-sm">
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                      <SelectContent className="bg-white shadow-lg border-blue-200 rounded-md overflow-hidden">
                        {loadingContacts ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-500" />
                            <span className="text-sm">Loading contacts...</span>
                          </div>
                        ) : contacts.map((contact: Contact) => (
                          <SelectItem 
                            key={contact.id} 
                            value={contact.id}
                            className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                          >
                            <div className="flex items-center py-1">
                              <div className="bg-blue-100 rounded-full p-1 mr-2">
                                <User className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="font-medium">{contact.firstName} {contact.lastName}</span>
                              <span className="text-gray-500 text-xs ml-1">({contact.email})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedContact && (
                      <div className="mt-3 bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-2">
                          <p className="font-medium text-white text-sm flex items-center">
                            <User className="h-3 w-3 mr-1.5" />
                            Contact Information
                          </p>
                        </div>
                        {(() => {
                          const contact = contacts.find((c: Contact) => c.id === selectedContact);
                          return contact ? (
                            <div className="p-3 grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center">
                                <span className="text-blue-700 font-medium mr-1">Name:</span>
                                <span className="text-gray-700">{contact.firstName} {contact.lastName}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-blue-700 font-medium mr-1">Email:</span>
                                <span className="text-gray-700">{contact.email}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-blue-700 font-medium mr-1">Company:</span>
                                <span className="text-gray-700">{contact.company || 'N/A'}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-blue-700 font-medium mr-1">Position:</span>
                                <span className="text-gray-700">{contact.position || 'N/A'}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-blue-700 font-medium mr-1">Personality:</span>
                                <span className="text-gray-700">{contact.personalityType || 'Unknown'}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-blue-700 font-medium mr-1">Last Contact:</span>
                                <span className="text-gray-700">{contact.lastContact || 'Unknown'}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-blue-700 font-medium block mb-1">Notes:</span>
                                <p className="text-gray-700 bg-gray-50 p-1.5 rounded text-xs">{contact.personalityNotes || contact.notes || 'No additional notes'}</p>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Get AI Response'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Response Area */}
      {(isLoading || response) && (
        <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">AI Response</CardTitle>
                  <CardDescription className="text-blue-100">
                    {response && new Date(response.timestamp).toLocaleString()}
                  </CardDescription>
                </div>
              </div>
              {response && (
                <Button 
                  variant={copied ? "secondary" : "secondary"} 
                  size="sm" 
                  className={`ml-auto ${copied ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-white text-indigo-600 hover:bg-blue-50'}`}
                  onClick={handleCopyResponse}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] py-10">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-t-purple-500 border-b-indigo-500 border-l-blue-500 border-r-blue-300 animate-spin"></div>
                  <Brain className="h-6 w-6 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-6 text-sm text-indigo-600 font-medium">
                  Generating response...
                </p>
                <p className="text-xs text-gray-500 mt-2">This may take a few moments</p>
              </div>
            ) : response ? (
              <div 
                ref={responseRef}
                className="p-6 bg-white border border-blue-100 rounded-lg text-gray-800 shadow-inner"
                style={{ minHeight: '200px' }}
                dangerouslySetInnerHTML={{ __html: formatResponse(response.content) }}
              />
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      {!response && !isLoading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-700 text-lg">Tips for Effective Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span>Be specific about what you need help with</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span>For dispute resolution, include all relevant details from both sides</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span>When analyzing data, provide context about what insights you're looking for</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span>For email assistance, include the original message you're responding to</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
