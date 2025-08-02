'use client';

import React, { useState, useEffect } from 'react';
import { Supplier, SupplierEmail } from '@/types/supplier';
import { fetchSuppliers, parseSupplierEmail, fetchAllSupplierEmails } from '@/lib/suppliers/api';
import { formatDate, extractProductNames, extractEmailSender, extractEmailSubject, extractEmailDate } from '@/lib/suppliers/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Plus, X, Clipboard, Search, AlertCircle, Check, FileText } from 'lucide-react';

export default function EmailParser() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [emails, setEmails] = useState<SupplierEmail[]>([]);
  const [emailContent, setEmailContent] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('none');
  const [productTags, setProductTags] = useState<string[]>([]);
  const [newProductTag, setNewProductTag] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previewData, setPreviewData] = useState<{
    senderName: string;
    senderEmail: string;
    subject: string;
    date: Date;
  } | null>(null);

  // Load suppliers and emails on component mount
  useEffect(() => {
    loadSuppliers();
    loadEmails();
  }, []);

  // Update preview data when email content changes
  useEffect(() => {
    if (emailContent) {
      const sender = extractEmailSender(emailContent);
      const subject = extractEmailSubject(emailContent);
      const date = extractEmailDate(emailContent);
      
      setPreviewData({
        senderName: sender.name,
        senderEmail: sender.email,
        subject,
        date
      });
      
      // Auto-detect product tags
      const detectedProducts = extractProductNames(emailContent);
      setProductTags(detectedProducts);
      
      // Try to find matching supplier by email
      if (sender.email && suppliers.length > 0) {
        const matchingSupplier = suppliers.find(
          s => s.email.toLowerCase() === sender.email.toLowerCase()
        );
        
        if (matchingSupplier) {
          setSelectedSupplierId(matchingSupplier.id);
        } else {
          setSelectedSupplierId('none');
        }
      } else {
        setSelectedSupplierId('none');
      }
    } else {
      setPreviewData(null);
      setProductTags([]);
    }
  }, [emailContent, suppliers]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError('Failed to load suppliers. Please try again.');
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllSupplierEmails();
      setEmails(data);
    } catch (err) {
      setError('Failed to load emails. Please try again.');
      console.error('Error loading emails:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductTag = () => {
    if (newProductTag && !productTags.includes(newProductTag)) {
      setProductTags([...productTags, newProductTag]);
      setNewProductTag('');
    }
  };

  const handleRemoveProductTag = (tag: string) => {
    setProductTags(productTags.filter(t => t !== tag));
  };

  const handleParse = async () => {
    if (!emailContent) {
      setError('Please enter email content.');
      return;
    }

    try {
      setParsing(true);
      setError(null);
      setSuccess(null);
      
      await parseSupplierEmail(
        emailContent,
        productTags,
        selectedSupplierId === 'none' ? undefined : selectedSupplierId
      );
      
      // Reset form
      setEmailContent('');
      setProductTags([]);
      setSelectedSupplierId('none');
      setPreviewData(null);
      
      // Reload emails
      await loadEmails();
      
      setSuccess('Email parsed and saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to parse email. Please try again.');
      console.error('Error parsing email:', err);
    } finally {
      setParsing(false);
    }
  };

  const handleClearContent = () => {
    setEmailContent('');
    setProductTags([]);
    setPreviewData(null);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setEmailContent(text);
    } catch (err) {
      setError('Failed to paste from clipboard. Please paste manually.');
      console.error('Error pasting from clipboard:', err);
    }
  };

  // Filter emails based on search term
  const filteredEmails = emails.filter(email => 
    email.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.senderEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.productTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Column - Email Input Form */}
        <div className="bg-gradient-to-b from-blue-50 to-white p-6 rounded-lg border border-blue-100 shadow-md">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mr-3 shadow-sm">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Paste Email Content</h3>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="Paste email content here..."
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="min-h-[200px]"
              />
              <div className="absolute top-2 right-2 flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePasteFromClipboard}
                  title="Paste from clipboard"
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearContent}
                  disabled={!emailContent}
                  title="Clear content"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {previewData && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-md border border-blue-100 shadow-sm">
                <h4 className="font-medium text-sm text-blue-700 mb-2 flex items-center">
                  <div className="p-1 bg-blue-100 rounded-full mr-2">
                    <Mail className="h-3 w-3 text-blue-600" />
                  </div>
                  Email Preview
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="flex items-start">
                    <span className="font-medium text-blue-800 w-16">From:</span> 
                    <span className="text-blue-700">{previewData.senderName} <span className="text-blue-500">&lt;{previewData.senderEmail}&gt;</span></span>
                  </p>
                  <p className="flex items-start">
                    <span className="font-medium text-blue-800 w-16">Subject:</span> 
                    <span className="text-blue-700">{previewData.subject}</span>
                  </p>
                  <p className="flex items-start">
                    <span className="font-medium text-blue-800 w-16">Date:</span> 
                    <span className="text-blue-700">{formatDate(previewData.date)}</span>
                  </p>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="supplier" className="text-blue-800 font-medium">Link to Supplier (Optional)</Label>
              <Select
                value={selectedSupplierId}
                onValueChange={setSelectedSupplierId}
              >
                <SelectTrigger id="supplier" className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent className="z-[100] max-h-[300px] overflow-y-auto border-blue-200 shadow-md">
                  <SelectItem value="none" className="text-blue-700">None</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id} className="text-blue-700 hover:bg-blue-50 focus:bg-blue-50">
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-blue-800 font-medium">Product Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-3 p-2 bg-blue-50 rounded-md border border-blue-100 min-h-[40px]">
                {productTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200 hover:from-blue-200 hover:to-indigo-200 transition-all duration-200">
                    {tag}
                    <button 
                      onClick={() => handleRemoveProductTag(tag)}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {productTags.length === 0 && (
                  <span className="text-sm text-blue-500 italic">No product tags detected</span>
                )}
              </div>
              <div className="flex">
                <Input
                  placeholder="Add product tag..."
                  value={newProductTag}
                  onChange={(e) => setNewProductTag(e.target.value)}
                  className="rounded-r-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Button
                  onClick={handleAddProductTag}
                  disabled={!newProductTag}
                  className="rounded-l-none bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button
              onClick={handleParse}
              disabled={!emailContent || parsing}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              {parsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Save Email
                </>
              )}
            </Button>
            
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 text-red-700 px-5 py-4 rounded-lg flex items-center shadow-md">
                <div className="p-2 bg-red-100 rounded-full mr-3">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h4 className="font-medium text-red-800">Error</h4>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 text-green-700 px-5 py-4 rounded-lg flex items-center shadow-md">
                <div className="p-2 bg-green-100 rounded-full mr-3">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800">Success</h4>
                  <p className="text-green-700">{success}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Emails List */}
        <div className="bg-gradient-to-b from-blue-50 to-white p-6 rounded-lg border border-blue-100 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mr-3 shadow-sm">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Saved Emails</h3>
            </div>
            
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px] border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12 bg-gradient-to-b from-blue-50 to-white rounded-lg border border-blue-100">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-md">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
              <p className="text-blue-700 font-medium">Loading emails...</p>
              <p className="text-sm text-blue-500 mt-2">This may take a few moments</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-12 border border-blue-100 rounded-lg bg-gradient-to-b from-blue-50 to-white shadow-sm">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-md">
                  <Mail className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-blue-800 font-medium text-lg mb-2">No emails found</h3>
              <p className="text-blue-600 mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? 'No emails match your search criteria. Try a different search term.' 
                  : 'Parse your first email to start tracking supplier communications.'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden shadow-md border border-blue-100">
              <Table>
                <TableHeader className="bg-gradient-to-r from-blue-500 to-indigo-600">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-white font-medium">Sender</TableHead>
                    <TableHead className="text-white font-medium">Subject</TableHead>
                    <TableHead className="text-white font-medium">Date</TableHead>
                    <TableHead className="text-white font-medium">Products</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.map((email) => {
                    const supplier = suppliers.find(s => s.id === email.supplierId);
                    
                    return (
                      <TableRow key={email.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium text-blue-800">{email.senderName}</div>
                            <div className="text-sm text-blue-600">{email.senderEmail}</div>
                            {supplier && (
                              <Badge variant="outline" className="mt-1 border-blue-200 text-blue-700 bg-blue-50">
                                {supplier.name}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-blue-700">{email.subject}</TableCell>
                        <TableCell className="text-blue-700">{formatDate(email.receivedDate)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {email.productTags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200">
                                {tag}
                              </Badge>
                            ))}
                            {email.productTags.length === 0 && (
                              <span className="text-xs text-blue-500 italic">None</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
