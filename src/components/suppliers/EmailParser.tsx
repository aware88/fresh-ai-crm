'use client';

import React, { useState, useEffect } from 'react';
import { Supplier, SupplierEmail } from '@/types/supplier';
import { fetchSuppliers, parseSupplierEmail, fetchSupplierEmails } from '@/lib/suppliers/api';
import { formatDate, extractProductNames, extractEmailSender, extractEmailSubject, extractEmailDate } from '@/lib/suppliers/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Plus, X, Clipboard, Search } from 'lucide-react';

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
      const data = await fetchSupplierEmails();
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
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
          <h3 className="text-lg font-semibold mb-4">Paste Email Content</h3>
          
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
              <div className="bg-white p-4 rounded-md border border-gray-200">
                <h4 className="font-medium text-sm text-gray-500 mb-2">Email Preview</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>From:</strong> {previewData.senderName} &lt;{previewData.senderEmail}&gt;</p>
                  <p><strong>Subject:</strong> {previewData.subject}</p>
                  <p><strong>Date:</strong> {formatDate(previewData.date)}</p>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="supplier">Link to Supplier (Optional)</Label>
              <Select
                value={selectedSupplierId}
                onValueChange={setSelectedSupplierId}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Product Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {productTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button 
                      onClick={() => handleRemoveProductTag(tag)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {productTags.length === 0 && (
                  <span className="text-sm text-gray-500">No product tags</span>
                )}
              </div>
              <div className="flex">
                <Input
                  placeholder="Add product tag..."
                  value={newProductTag}
                  onChange={(e) => setNewProductTag(e.target.value)}
                  className="rounded-r-none"
                />
                <Button
                  onClick={handleAddProductTag}
                  disabled={!newProductTag}
                  className="rounded-l-none"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button
              onClick={handleParse}
              disabled={!emailContent || parsing}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
                <span className="mr-2">✅</span> {success}
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Emails List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Saved Emails</h3>
            
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <span className="ml-2 text-gray-500">Loading emails...</span>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">
                {searchTerm 
                  ? 'No emails match your search.' 
                  : 'No emails found. Parse your first email to get started.'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sender</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Products</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.map((email) => {
                    const supplier = suppliers.find(s => s.id === email.supplierId);
                    
                    return (
                      <TableRow key={email.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{email.senderName}</div>
                            <div className="text-sm text-gray-500">{email.senderEmail}</div>
                            {supplier && (
                              <Badge variant="outline" className="mt-1">
                                {supplier.name}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{email.subject}</TableCell>
                        <TableCell>{formatDate(email.receivedDate)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {email.productTags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {email.productTags.length === 0 && (
                              <span className="text-xs text-gray-500">None</span>
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
