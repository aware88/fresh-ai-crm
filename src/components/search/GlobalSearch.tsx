'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Mail, Target, FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  title: string;
  type: 'lead' | 'campaign' | 'email' | 'product' | 'contact';
  description: string;
  url: string;
  relevance: number;
}

// Real search API call will be implemented here

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'lead':
    case 'contact':
      return <Users className="h-4 w-4" />;
    case 'campaign':
      return <Target className="h-4 w-4" />;
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'product':
      return <FileText className="h-4 w-4" />;
    default:
      return <Search className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'lead':
      return 'bg-blue-100 text-blue-800';
    case 'contact':
      return 'bg-green-100 text-green-800';
    case 'campaign':
      return 'bg-purple-100 text-purple-800';
    case 'email':
      return 'bg-orange-100 text-orange-800';
    case 'product':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

export function GlobalSearch({ placeholder = "Search leads, campaigns, or insights...", className }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    const performSearch = async () => {
      try {
        // Search across multiple data sources
        const searchPromises = [
          fetch(`/api/search/leads?q=${encodeURIComponent(query)}`).then(r => r.ok ? r.json() : { results: [] }),
          fetch(`/api/search/campaigns?q=${encodeURIComponent(query)}`).then(r => r.ok ? r.json() : { results: [] }),
          fetch(`/api/search/contacts?q=${encodeURIComponent(query)}`).then(r => r.ok ? r.json() : { results: [] }),
          fetch(`/api/search/emails?q=${encodeURIComponent(query)}`).then(r => r.ok ? r.json() : { results: [] })
        ];

        const [leadsRes, campaignsRes, contactsRes, emailsRes] = await Promise.all(searchPromises);
        
        const allResults: SearchResult[] = [
          ...(leadsRes.results || []).map((item: any) => ({ ...item, type: 'lead' as const })),
          ...(campaignsRes.results || []).map((item: any) => ({ ...item, type: 'campaign' as const })),
          ...(contactsRes.results || []).map((item: any) => ({ ...item, type: 'contact' as const })),
          ...(emailsRes.results || []).map((item: any) => ({ ...item, type: 'email' as const }))
        ];

        // Sort by relevance
        allResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
        
        setResults(allResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 300); // Debounce
    return () => clearTimeout(timer);
  }, [query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    router.push(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-modern pl-10"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-2">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-1.5 rounded-md", getTypeColor(result.type))}>
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{result.title}</h4>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {result.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {result.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-4 text-center">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for leads, campaigns, or contacts
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}