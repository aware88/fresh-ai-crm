'use client';

import React, { useState, useEffect } from 'react';
import { SupplierQuery } from '@/types/supplier';
import { fetchQueryHistory, fetchQueryById } from '@/lib/suppliers/api';
import { formatDate, formatReliabilityScore } from '@/lib/suppliers/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, MessageSquare, ChevronRight, ChevronDown, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function HistoryViewer() {
  const [queries, setQueries] = useState<SupplierQuery[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<SupplierQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedResults, setExpandedResults] = useState<boolean>(false);

  // Load query history on component mount
  useEffect(() => {
    loadQueryHistory();
  }, []);

  const loadQueryHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchQueryHistory();
      // Sort by timestamp, newest first
      const sortedData = data.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setQueries(sortedData);
    } catch (err) {
      setError('Failed to load query history. Please try again.');
      console.error('Error loading query history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuery = async (query: SupplierQuery) => {
    if (selectedQuery?.id === query.id) {
      setSelectedQuery(null);
      return;
    }

    try {
      setLoading(true);
      const detailedQuery = await fetchQueryById(query.id);
      setSelectedQuery(detailedQuery);
    } catch (err) {
      setError('Failed to load query details. Please try again.');
      console.error('Error loading query details:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Filter queries based on search term
  const filteredQueries = queries.filter(query => 
    query.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    query.aiResponse.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Query History</h2>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-[250px]"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      {loading && queries.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500">Loading query history...</span>
        </div>
      ) : filteredQueries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">
            {searchTerm 
              ? 'No queries match your search.' 
              : 'No query history found. Use the AI Assistant to make your first query.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Query</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueries.map((query) => {
                  const isSelected = selectedQuery?.id === query.id;
                  
                  return (
                    <React.Fragment key={query.id}>
                      <TableRow 
                        className={`cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                        onClick={() => handleSelectQuery(query)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {isSelected ? (
                              <ChevronDown className="mr-2 h-4 w-4 text-blue-600" />
                            ) : (
                              <ChevronRight className="mr-2 h-4 w-4 text-gray-400" />
                            )}
                            {query.query}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(new Date(query.timestamp))}</TableCell>
                        <TableCell>
                          <Badge>{query.results?.length || 0} suppliers</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(query.query);
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {isSelected && (
                        <TableRow>
                          <TableCell colSpan={4} className="bg-blue-50 p-0">
                            <div className="p-4">
                              <div className="bg-white border border-blue-100 rounded-lg p-4 mb-4">
                                <div className="flex items-center mb-2">
                                  <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                                  <span className="font-medium text-blue-600">AI Response</span>
                                </div>
                                <div className="prose max-w-none">
                                  <ReactMarkdown>{selectedQuery.aiResponse}</ReactMarkdown>
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="font-medium text-gray-700">
                                    Supplier Results ({selectedQuery.results.length})
                                  </h4>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setExpandedResults(!expandedResults)}
                                  >
                                    {expandedResults ? 'Collapse' : 'Expand All'}
                                  </Button>
                                </div>
                                
                                {selectedQuery.results.length === 0 ? (
                                  <p className="text-gray-500 text-sm">No supplier results for this query.</p>
                                ) : (
                                  <div className="space-y-3">
                                    {selectedQuery.results.slice(0, expandedResults ? undefined : 3).map((result) => {
                                      const reliability = formatReliabilityScore(result.supplier.reliabilityScore || 0);
                                      
                                      return (
                                        <Card key={result.supplier.id} className="overflow-hidden">
                                          <CardContent className="p-4">
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <h5 className="font-medium text-lg">{result.supplier.name}</h5>
                                                <p className="text-sm text-gray-500">{result.supplier.email}</p>
                                              </div>
                                              <Badge 
                                                className={`bg-${reliability.color}-100 text-${reliability.color}-800 border-${reliability.color}-200`}
                                              >
                                                {reliability.label}
                                              </Badge>
                                            </div>
                                            
                                            {result.matchReason && (
                                              <div className="mt-2 text-sm">
                                                <p className="text-gray-700">{result.matchReason}</p>
                                              </div>
                                            )}
                                            
                                            {result.productMatches && result.productMatches.length > 0 && (
                                              <div className="mt-2">
                                                <p className="text-sm font-medium text-gray-700">Matching Products:</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                  {result.productMatches.map((product: string) => (
                                                    <Badge key={product} variant="outline">
                                                      {product}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </CardContent>
                                        </Card>
                                      );
                                    })}
                                    
                                    {!expandedResults && selectedQuery.results.length > 3 && (
                                      <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setExpandedResults(true)}
                                      >
                                        Show {selectedQuery.results.length - 3} more results
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
