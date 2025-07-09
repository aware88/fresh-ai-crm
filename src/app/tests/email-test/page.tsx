'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function EmailTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState({
    emailId: '',
    testEmail: {
      subject: 'Test Email from CRM Mind',
      content: '<p>This is a test email sent from the CRM Mind.</p>',
      contentType: 'HTML',
      toRecipients: ['test@example.com'], // Replace with a real email address
    },
    testAIPrompt: 'Analyze this email and suggest a response strategy.'
  });
  const [results, setResults] = useState({
    fetchEmails: { status: '', message: '' },
    fetchEmailDetails: { status: '', message: '' },
    markEmailReadUnread: { status: '', message: '' },
    sendEmail: { status: '', message: '' },
    aiAnalysis: { status: '', message: '' },
    deleteEmail: { status: '', message: '' },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  // Step 1: Fetch emails
  const testFetchEmails = async () => {
    setResults(prev => ({
      ...prev,
      fetchEmails: { status: 'running', message: 'Testing: Fetch Emails...' }
    }));
    
    try {
      const response = await fetch('/api/emails?top=10', {
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        // Save the first email ID for further tests if none was provided
        if (!testData.emailId && result.data.length > 0) {
          setTestData(prev => ({
            ...prev,
            emailId: result.data[0].id
          }));
        }
        
        setResults(prev => ({
          ...prev,
          fetchEmails: { 
            status: 'success', 
            message: `Successfully fetched emails: ${result.data.length}` 
          }
        }));
        return true;
      } else {
        setResults(prev => ({
          ...prev,
          fetchEmails: { 
            status: 'error', 
            message: `Failed to fetch emails: ${JSON.stringify(result)}` 
          }
        }));
        return false;
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        fetchEmails: { 
          status: 'error', 
          message: `Error fetching emails: ${error.message}` 
        }
      }));
      return false;
    }
  };

  // Step 2: Fetch email details
  const testFetchEmailDetails = async () => {
    setResults(prev => ({
      ...prev,
      fetchEmailDetails: { status: 'running', message: 'Testing: Fetch Email Details...' }
    }));
    
    if (!testData.emailId) {
      setResults(prev => ({
        ...prev,
        fetchEmailDetails: { 
          status: 'error', 
          message: 'No email ID provided. Please fetch emails first or enter an email ID manually.' 
        }
      }));
      return false;
    }
    
    try {
      const response = await fetch(`/api/emails/${testData.emailId}`, {
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      
      if (result.data && result.data.id) {
        setResults(prev => ({
          ...prev,
          fetchEmailDetails: { 
            status: 'success', 
            message: `Successfully fetched email details: "${result.data.subject}"` 
          }
        }));
        return true;
      } else {
        setResults(prev => ({
          ...prev,
          fetchEmailDetails: { 
            status: 'error', 
            message: `Failed to fetch email details: ${JSON.stringify(result)}` 
          }
        }));
        return false;
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        fetchEmailDetails: { 
          status: 'error', 
          message: `Error fetching email details: ${error.message}` 
        }
      }));
      return false;
    }
  };

  // Step 3: Mark email as read/unread
  const testMarkEmailReadUnread = async () => {
    setResults(prev => ({
      ...prev,
      markEmailReadUnread: { status: 'running', message: 'Testing: Mark Email as Read/Unread...' }
    }));
    
    if (!testData.emailId) {
      setResults(prev => ({
        ...prev,
        markEmailReadUnread: { 
          status: 'error', 
          message: 'No email ID provided. Please fetch emails first or enter an email ID manually.' 
        }
      }));
      return false;
    }
    
    try {
      // Mark as read
      let response = await fetch(`/api/emails/${testData.emailId}`, {
        method: 'PATCH',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isRead: false })
      });
      let result = await response.json();
      
      if (result.success) {
        setResults(prev => ({
          ...prev,
          markEmailReadUnread: { 
            status: 'success', 
            message: 'Successfully marked email as read' 
          }
        }));
      } else {
        setResults(prev => ({
          ...prev,
          markEmailReadUnread: { 
            status: 'error', 
            message: `Failed to mark email as read: ${JSON.stringify(result)}` 
          }
        }));
        return false;
      }
      
      // Mark as unread
      response = await fetch(`/api/emails/${testData.emailId}`, {
        method: 'PATCH',
        credentials: 'include', // Include cookies in the request
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: false })
      });
      result = await response.json();
      
      if (result.success) {
        setResults(prev => ({
          ...prev,
          markEmailReadUnread: { 
            status: 'success', 
            message: 'Successfully marked email as read/unread' 
          }
        }));
        return true;
      } else {
        setResults(prev => ({
          ...prev,
          markEmailReadUnread: { 
            status: 'error', 
            message: `Failed to mark email as unread: ${JSON.stringify(result)}` 
          }
        }));
        return false;
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        markEmailReadUnread: { 
          status: 'error', 
          message: `Error updating email read status: ${error.message}` 
        }
      }));
      return false;
    }
  };

  // Step 4: Send a test email
  const testSendEmail = async () => {
    setResults(prev => ({
      ...prev,
      sendEmail: { status: 'running', message: 'Testing: Send Email...' }
    }));
    
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData.testEmail)
      });
      const result = await response.json();
      
      if (result.success) {
        setResults(prev => ({
          ...prev,
          sendEmail: { 
            status: 'success', 
            message: 'Successfully sent test email' 
          }
        }));
        return true;
      } else {
        setResults(prev => ({
          ...prev,
          sendEmail: { 
            status: 'error', 
            message: `Failed to send test email: ${JSON.stringify(result)}` 
          }
        }));
        return false;
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        sendEmail: { 
          status: 'error', 
          message: `Error sending test email: ${error.message}` 
        }
      }));
      return false;
    }
  };

  // Step 5: Test AI analysis
  const testAIAnalysis = async () => {
    setResults(prev => ({
      ...prev,
      aiAnalysis: { status: 'running', message: 'Testing: AI Analysis...' }
    }));
    
    if (!testData.emailId) {
      setResults(prev => ({
        ...prev,
        aiAnalysis: { 
          status: 'error', 
          message: 'No email ID provided. Please fetch emails first or enter an email ID manually.' 
        }
      }));
      return false;
    }
    
    try {
      // Get AI context
      let response = await fetch(`/api/emails/ai-context?emailId=${testData.emailId}`, {
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json'
        }
      });
      let result = await response.json();
      
      if (result.success && result.data) {
        setResults(prev => ({
          ...prev,
          aiAnalysis: { 
            status: 'success', 
            message: 'Successfully fetched AI context' 
          }
        }));
      } else {
        setResults(prev => ({
          ...prev,
          aiAnalysis: { 
            status: 'error', 
            message: `Failed to fetch AI context: ${JSON.stringify(result)}` 
          }
        }));
        return false;
      }
      
      // Generate AI response
      response = await fetch('/api/emails/ai-context', {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: testData.emailId,
          prompt: testData.testAIPrompt
        })
      });
      result = await response.json();
      
      if (result.success && result.data && result.data.response) {
        setResults(prev => ({
          ...prev,
          aiAnalysis: { 
            status: 'success', 
            message: `Successfully generated AI response: ${result.data.response.substring(0, 100)}...` 
          }
        }));
        return true;
      } else {
        setResults(prev => ({
          ...prev,
          aiAnalysis: { 
            status: 'error', 
            message: `Failed to generate AI response: ${JSON.stringify(result)}` 
          }
        }));
        return false;
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        aiAnalysis: { 
          status: 'error', 
          message: `Error testing AI analysis: ${error.message}` 
        }
      }));
      return false;
    }
  };

  // Step 6: Delete email
  const testDeleteEmail = async () => {
    setResults(prev => ({
      ...prev,
      deleteEmail: { status: 'running', message: 'Testing: Delete Email...' }
    }));
    
    if (!testData.emailId) {
      setResults(prev => ({
        ...prev,
        deleteEmail: { 
          status: 'error', 
          message: 'No email ID provided. Please fetch emails first or enter an email ID manually.' 
        }
      }));
      return false;
    }
    
    try {
      const response = await fetch(`/api/emails/${testData.emailId}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setResults(prev => ({
          ...prev,
          deleteEmail: { 
            status: 'success', 
            message: 'Successfully deleted email' 
          }
        }));
        return true;
      } else {
        setResults(prev => ({
          ...prev,
          deleteEmail: { 
            status: 'error', 
            message: `Failed to delete email: ${JSON.stringify(result)}` 
          }
        }));
        return false;
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        deleteEmail: { 
          status: 'error', 
          message: `Error deleting email: ${error.message}` 
        }
      }));
      return false;
    }
  };

  // Run all tests
  const runAllTests = async () => {
    await testFetchEmails();
    await testFetchEmailDetails();
    await testMarkEmailReadUnread();
    await testSendEmail();
    await testAIAnalysis();
    await testDeleteEmail();
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Email Workflow Test</h1>
      <p className="mb-6">This page helps test the email functionality in the CRM Mind.</p>
      
      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-2">Test Configuration</h2>
        <label className="block mb-2">Email ID:</label>
        <input 
          type="text" 
          value={testData.emailId} 
          onChange={(e) => setTestData(prev => ({ ...prev, emailId: e.target.value }))}
          className="w-full p-2 border rounded mb-2"
          placeholder="Enter an email ID or fetch emails to auto-populate"
        />
        <label className="block mb-2">Test Email Recipient:</label>
        <input 
          type="email" 
          value={testData.testEmail.toRecipients[0]} 
          onChange={(e) => setTestData(prev => ({ 
            ...prev, 
            testEmail: {
              ...prev.testEmail,
              toRecipients: [e.target.value]
            }
          }))}
          className="w-full p-2 border rounded"
          placeholder="Enter a valid email address for testing"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-2">1. Fetch Emails</h2>
          <button 
            onClick={testFetchEmails}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Fetch Emails
          </button>
          {results.fetchEmails.status && (
            <div className={`mt-2 p-2 rounded ${
              results.fetchEmails.status === 'success' ? 'bg-green-100' : 
              results.fetchEmails.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {results.fetchEmails.message}
            </div>
          )}
        </div>
        
        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-2">2. Fetch Email Details</h2>
          <button 
            onClick={testFetchEmailDetails}
            disabled={!testData.emailId}
            className={`px-4 py-2 rounded ${
              !testData.emailId ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Fetch Email Details
          </button>
          {results.fetchEmailDetails.status && (
            <div className={`mt-2 p-2 rounded ${
              results.fetchEmailDetails.status === 'success' ? 'bg-green-100' : 
              results.fetchEmailDetails.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {results.fetchEmailDetails.message}
            </div>
          )}
        </div>
        
        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-2">3. Mark Email Read/Unread</h2>
          <button 
            onClick={testMarkEmailReadUnread}
            disabled={!testData.emailId}
            className={`px-4 py-2 rounded ${
              !testData.emailId ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Mark Email Read/Unread
          </button>
          {results.markEmailReadUnread.status && (
            <div className={`mt-2 p-2 rounded ${
              results.markEmailReadUnread.status === 'success' ? 'bg-green-100' : 
              results.markEmailReadUnread.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {results.markEmailReadUnread.message}
            </div>
          )}
        </div>
        
        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-2">4. Send Test Email</h2>
          <button 
            onClick={testSendEmail}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Send Test Email
          </button>
          {results.sendEmail.status && (
            <div className={`mt-2 p-2 rounded ${
              results.sendEmail.status === 'success' ? 'bg-green-100' : 
              results.sendEmail.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {results.sendEmail.message}
            </div>
          )}
        </div>
        
        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-2">5. Test AI Analysis</h2>
          <button 
            onClick={testAIAnalysis}
            disabled={!testData.emailId}
            className={`px-4 py-2 rounded ${
              !testData.emailId ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Test AI Analysis
          </button>
          {results.aiAnalysis.status && (
            <div className={`mt-2 p-2 rounded ${
              results.aiAnalysis.status === 'success' ? 'bg-green-100' : 
              results.aiAnalysis.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {results.aiAnalysis.message}
            </div>
          )}
        </div>
        
        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-2">6. Delete Email</h2>
          <button 
            onClick={testDeleteEmail}
            disabled={!testData.emailId}
            className={`px-4 py-2 rounded ${
              !testData.emailId ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Delete Email
          </button>
          {results.deleteEmail.status && (
            <div className={`mt-2 p-2 rounded ${
              results.deleteEmail.status === 'success' ? 'bg-green-100' : 
              results.deleteEmail.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {results.deleteEmail.message}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-2">Run All Tests</h2>
        <button 
          onClick={runAllTests}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Run All Tests
        </button>
      </div>
    </div>
  );
}
