'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

// Types for the table system
export interface ArisTableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface ArisTableFilter {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface ArisTableAction<T = any> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  show?: (row: T) => boolean;
}

export interface ArisTableProps<T = any> {
  data: T[];
  columns: ArisTableColumn<T>[];
  title?: string;
  description?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: ArisTableFilter[];
  actions?: ArisTableAction<T>[];
  pageSize?: number;
  showPagination?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

// Sort direction type
type SortDirection = 'asc' | 'desc' | null;

// Pagination component
const ArisTablePagination: React.FC<{
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const pageNumbers = [];
  const maxPageButtons = 5;
  
  // Calculate range of page numbers to show
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
  
  if (endPage - startPage + 1 < maxPageButtons) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
        <span className="font-medium">
          {Math.min(currentPage * pageSize, totalItems)}
        </span>{' '}
        of <span className="font-medium">{totalItems}</span> results
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm">
          <span>Rows per page:</span>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {pageNumbers.map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                className={currentPage === page ? 'bg-gradient-to-r from-blue-500 to-purple-500' : ''}
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main table component
export const ArisTable = <T extends Record<string, any>>({
  data,
  columns,
  title,
  description,
  searchable = true,
  searchPlaceholder = "Search...",
  filters = [],
  actions = [],
  pageSize = 10,
  showPagination = true,
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
  className = "",
}: ArisTableProps<T>) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = row[column.key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply column filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(row => {
          const cellValue = row[key];
          return cellValue?.toString().toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, activeFilters, sortColumn, sortDirection, columns]);

  // Pagination
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / currentPageSize);
  const startIndex = (currentPage - 1) * currentPageSize;
  const paginatedData = processedData.slice(startIndex, startIndex + currentPageSize);

  // Handlers
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(
        sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc'
      );
      if (sortDirection === 'desc') {
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setCurrentPageSize(size);
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || Object.values(activeFilters).some(value => value && value !== 'all');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </CardHeader>
        )}
        
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          {(searchable || filters.length > 0) && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                {searchable && (
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                        onClick={() => setSearchTerm('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Filters */}
                {filters.map((filter) => (
                  <div key={filter.key} className="w-full sm:w-48">
                    {filter.type === 'select' ? (
                      <Select
                        value={activeFilters[filter.key] || 'all'}
                        onValueChange={(value) => handleFilterChange(filter.key, value)}
                      >
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder={filter.label} />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All {filter.label}</SelectItem>
                          {filter.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder={filter.placeholder || `Filter by ${filter.label}`}
                          value={activeFilters[filter.key] || ''}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Search: "{searchTerm}"
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => setSearchTerm('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {Object.entries(activeFilters).map(([key, value]) => {
                    if (!value || value === 'all') return null;
                    const filter = filters.find(f => f.key === key);
                    return (
                      <Badge key={key} variant="secondary" className="gap-1">
                        {filter?.label}: {value}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => handleFilterChange(key, 'all')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={`${column.width || ''} ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                    >
                      {column.sortable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 p-0 font-semibold"
                          onClick={() => handleSort(column.key)}
                        >
                          {column.label}
                          {sortColumn === column.key && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </Button>
                      ) : (
                        column.label
                      )}
                    </TableHead>
                  ))}
                  {actions.length > 0 && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="wait">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="h-24 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="h-24 text-center">
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className={`border-b transition-colors hover:bg-muted/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                        onClick={() => onRowClick?.(row)}
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={column.key}
                            className={column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}
                          >
                            {column.render ? column.render(row[column.key], row) : row[column.key]}
                          </TableCell>
                        ))}
                        {actions.length > 0 && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {actions.map((action, actionIndex) => {
                                if (action.show && !action.show(row)) return null;
                                return (
                                  <Button
                                    key={actionIndex}
                                    variant={action.variant || 'ghost'}
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.onClick(row);
                                    }}
                                  >
                                    {action.icon && <action.icon className="h-4 w-4" />}
                                    {action.label}
                                  </Button>
                                );
                              })}
                            </div>
                          </TableCell>
                        )}
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {showPagination && totalItems > 0 && (
            <ArisTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={currentPageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Export common action creators
export const createTableActions = {
  view: function<T>(onClick: (row: T) => void): ArisTableAction<T> {
    return {
      label: 'View',
      icon: Eye,
      onClick,
      variant: 'outline',
    };
  },
  edit: function<T>(onClick: (row: T) => void): ArisTableAction<T> {
    return {
      label: 'Edit',
      icon: Edit,
      onClick,
      variant: 'outline',
    };
  },
  delete: function<T>(onClick: (row: T) => void): ArisTableAction<T> {
    return {
      label: 'Delete',
      icon: Trash2,
      onClick,
      variant: 'destructive',
    };
  },
};

// Helper functions for creating actions
export function createViewAction<T>(onClick: (row: T) => void): ArisTableAction<T> {
  return {
    label: 'View',
    icon: Eye,
    onClick,
    variant: 'outline',
  };
}

export function createEditAction<T>(onClick: (row: T) => void): ArisTableAction<T> {
  return {
    label: 'Edit',
    icon: Edit,
    onClick,
    variant: 'outline',
  };
}

export function createDeleteAction<T>(onClick: (row: T) => void): ArisTableAction<T> {
  return {
    label: 'Delete',
    icon: Trash2,
    onClick,
    variant: 'destructive',
  };
}

export default ArisTable; 