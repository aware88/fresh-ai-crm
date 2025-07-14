'use client';

import React, { useState, useEffect } from 'react';
import { Supplier } from '@/types/supplier';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/lib/suppliers/api';
import { formatReliabilityScore } from '@/lib/suppliers/utils';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, ExternalLink, Loader2, Pencil, Plus, Trash2, FileText } from "lucide-react";

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier>>({});
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  // Load suppliers on component mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSuppliers();
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error loading suppliers:', err);
      // Only show error for actual server errors, not authentication issues
      if (err instanceof Error && err.message.includes('500')) {
        setError('Failed to load suppliers. Please try again.');
      } else {
        // For other errors (like auth issues), just show empty state
        setSuppliers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setCurrentSupplier({});
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (supplier: Supplier) => {
    setCurrentSupplier({ ...supplier });
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (id: string) => {
    setSupplierToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if ('id' in currentSupplier && currentSupplier.id) {
        // Update existing supplier
        await updateSupplier(currentSupplier as Supplier);
      } else {
        // Create new supplier
        await createSupplier({
          name: currentSupplier.name || '',
          email: currentSupplier.email || '',
          phone: currentSupplier.phone,
          website: currentSupplier.website,
          notes: currentSupplier.notes,
        });
      }
      
      setIsDialogOpen(false);
      loadSuppliers();
    } catch (err) {
      setError(`Failed to ${currentSupplier.id ? 'update' : 'create'} supplier. Please try again.`);
      console.error(`Error ${currentSupplier.id ? 'updating' : 'creating'} supplier:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!supplierToDelete) return;
    
    try {
      setLoading(true);
      await deleteSupplier(supplierToDelete);
      setIsDeleteDialogOpen(false);
      loadSuppliers();
    } catch (err) {
      setError('Failed to delete supplier. Please try again.');
      console.error('Error deleting supplier:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mr-3 shadow-md">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Suppliers</h2>
            {loading && suppliers.length > 0 && (
              <div className="flex items-center text-blue-500 text-sm">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                <span>Refreshing...</span>
              </div>
            )}
          </div>
        </div>
        <Button 
          onClick={handleOpenAddDialog} 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 text-red-700 px-5 py-4 rounded-lg mb-6 flex items-center shadow-md">
          <div className="p-2 bg-red-100 rounded-full mr-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h4 className="font-medium text-red-800">Error</h4>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {loading && suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] py-10 bg-gradient-to-b from-blue-50 to-white rounded-lg shadow-sm border border-blue-100">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-1 shadow-lg">
              <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            </div>
          </div>
          <p className="mt-6 text-base text-blue-700 font-medium">
            Loading suppliers...
          </p>
          <p className="text-sm text-blue-500 mt-2">This may take a few moments</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12 border border-blue-100 rounded-lg bg-gradient-to-b from-blue-50 to-white shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-md">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h3 className="text-blue-800 font-medium text-lg mb-2">No suppliers yet</h3>
          <p className="text-blue-600 mb-6 max-w-md mx-auto">Add your first supplier to start managing your supply chain efficiently.</p>
          <Button 
            onClick={handleOpenAddDialog} 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-blue-100 shadow-sm">
          <Table>
            <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <TableRow className="hover:bg-transparent border-blue-100">
                <TableHead className="text-blue-700 font-medium">Name</TableHead>
                <TableHead className="text-blue-700 font-medium">Email</TableHead>
                <TableHead className="text-blue-700 font-medium">Phone</TableHead>
                <TableHead className="text-blue-700 font-medium">Website</TableHead>
                <TableHead className="text-blue-700 font-medium">Reliability</TableHead>
                <TableHead className="text-blue-700 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => {
                const reliability = formatReliabilityScore(supplier.reliabilityScore || 0);
                
                return (
                <TableRow key={supplier.id} className="border-blue-50 hover:bg-blue-50/30">
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.phone || '-'}</TableCell>
                  <TableCell>
                    {supplier.website ? (
                      <a 
                        href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {supplier.website}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium bg-${reliability.color}-100 text-${reliability.color}-800`}
                    >
                      {reliability.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                        onClick={() => handleOpenEditDialog(supplier)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-100"
                        onClick={() => handleOpenDeleteDialog(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-0 shadow-lg bg-gradient-to-b from-white to-blue-50">
          <DialogHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
            <DialogTitle className="text-white flex items-center">
              <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                {currentSupplier.id ? (
                  <Pencil className="h-5 w-5 text-white" />
                ) : (
                  <Plus className="h-5 w-5 text-white" />
                )}
              </div>
              {currentSupplier.id ? 'Edit Supplier' : 'Add New Supplier'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-blue-800">Name *</Label>
                <Input
                  id="name"
                  value={currentSupplier.name || ''}
                  onChange={(e) => setCurrentSupplier({ ...currentSupplier, name: e.target.value })}
                  placeholder="Supplier name"
                  required
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-blue-800">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentSupplier.email || ''}
                  onChange={(e) => setCurrentSupplier({ ...currentSupplier, email: e.target.value })}
                  placeholder="contact@supplier.com"
                  required
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-blue-800">Phone</Label>
                <Input
                  id="phone"
                  value={currentSupplier.phone || ''}
                  onChange={(e) => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website" className="text-blue-800">Website</Label>
                <Input
                  id="website"
                  value={currentSupplier.website || ''}
                  onChange={(e) => setCurrentSupplier({ ...currentSupplier, website: e.target.value })}
                  placeholder="www.supplier.com"
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes" className="text-blue-800">Notes</Label>
                <Textarea
                  id="notes"
                  value={currentSupplier.notes || ''}
                  onChange={(e) => setCurrentSupplier({ ...currentSupplier, notes: e.target.value })}
                  placeholder="Additional notes about this supplier"
                  rows={3}
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentSupplier.id ? 'Update' : 'Add'} Supplier
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] border-0 shadow-lg bg-gradient-to-b from-white to-red-50">
          <DialogHeader className="bg-gradient-to-r from-red-500 to-pink-600 pb-4 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
            <DialogTitle className="text-white flex items-center">
              <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              Are you sure?
            </DialogTitle>
            <p className="text-white text-opacity-90 mt-2">
              This action cannot be undone. This will permanently delete the supplier
              and all associated data.
            </p>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
