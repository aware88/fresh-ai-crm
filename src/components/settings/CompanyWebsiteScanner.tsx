import React, { useState, useEffect } from 'react';
import { CompanyInfo } from '../../lib/company/websiteScanner';
import { FiGlobe, FiCheck, FiInfo } from 'react-icons/fi';

const CompanyWebsiteScanner: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [lastScanned, setLastScanned] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch existing company info on component mount
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch('/api/company/info');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.companyInfo) {
            setCompanyInfo(data.companyInfo);
            setLastScanned(new Date(data.companyInfo.lastScanned));
            setUrl(data.companyInfo.websiteUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      }
    };

    fetchCompanyInfo();
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!url) {
      setError('Please enter your company website URL');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/company/scan-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.success) {
        setCompanyInfo(result.companyInfo);
        setLastScanned(new Date(result.companyInfo.lastScanned));
        setSuccess(`Successfully extracted information about ${result.companyInfo.name}`);
      } else {
        setError(result.error || 'Failed to scan website');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error scanning website:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <h3 className="text-lg font-semibold mb-2">Company Website Scanner</h3>
      <p className="text-gray-600 mb-4">
        Scan your company website to personalize AI responses with your business context
      </p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Website URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="e.g., https://yourcompany.com"
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter your company's website to extract information for AI personalization
          </p>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Last scanned: {formatDate(lastScanned)}
          </p>
          <button 
            type="submit" 
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scanning...
              </>
            ) : (
              <>
                <FiGlobe className="mr-2" />
                {companyInfo ? 'Rescan Website' : 'Scan Website'}
              </>
            )}
          </button>
        </div>
      </form>

      {companyInfo && (
        <>
          <hr className="my-4 border-gray-200" />
          
          <div className="mt-4">
            <div className="flex items-center mb-3">
              <h4 className="text-md font-semibold">Extracted Company Information</h4>
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Saved</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="font-bold">Company Name:</p>
                <p>{companyInfo.name}</p>
              </div>
              
              <div>
                <p className="font-bold">Description:</p>
                <p>{companyInfo.description}</p>
              </div>
              
              <div>
                <p className="font-bold">Industry:</p>
                <p>{companyInfo.industry}</p>
              </div>
              
              {companyInfo.products && companyInfo.products.length > 0 && (
                <div>
                  <p className="font-bold">Products:</p>
                  <ul className="mt-1 space-y-1">
                    {companyInfo.products.map((product, index) => (
                      <li key={index} className="flex items-start">
                        <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>{product}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {companyInfo.services && companyInfo.services.length > 0 && (
                <div>
                  <p className="font-bold">Services:</p>
                  <ul className="mt-1 space-y-1">
                    {companyInfo.services.map((service, index) => (
                      <li key={index} className="flex items-start">
                        <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>{service}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {companyInfo.targetAudience && (
                <div>
                  <p className="font-bold">Target Audience:</p>
                  <p>{companyInfo.targetAudience}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md flex items-start">
            <FiInfo className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
            <p className="text-sm">
              We'll analyze their website and extract key information about their business.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CompanyWebsiteScanner;
