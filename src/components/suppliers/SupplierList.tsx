'use client';

import React, { useState, useEffect } from 'react';
import { Supplier } from '@/types/supplier';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/lib/suppliers/api';
import { formatDate, formatReliabilityScore } from '@/lib/suppliers/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';

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
      setSuppliers(data);
    } catch (err) {
      setError('Failed to load suppliers. Please try again.');
      console.error('Error loading suppliers:', err);
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
        <h2 className="text-xl font-semibold">Suppliers</h2>
        <Button onClick={handleOpenAddDialog} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      {loading && suppliers.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500">Loading suppliers...</span>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">No suppliers found. Add your first supplier to get started.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Reliability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => {
                const reliability = formatReliabilityScore(supplier.reliabilityScore || 0);
                
                return (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>
                      {supplier.website ? (
                        <a 
                          href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          {supplier.website} <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      ) : (
                        '-'
                      )}
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
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenEditDialog(supplier)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentSupplier.id ? 'Edit Supplier' : 'Add New Supplier'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={currentSupplier.name || ''}
                  onChange={(e) => setCurrentSupplier({ ...currentSupplier, name: e.target.value })}
                  placeholder="Supplier name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentSupplier.email || ''}
                  onChange={(e) => setCurrentSupplier({ ...currentSupplier, email: e.target.value })}
                  placeholder="contact@supplier.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={currentSupplier.phone || ''}
                  onChange={(e) => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={currentSupplier.website || ''}
                  onChange={(e) => setCurrentSupplier({ ...currentSupplier, website: e.target.value })}
                  placeholder="www.supplier.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={currentSupplier.notes || ''}
                  onChange={(e) => setCurrentSupplier({ ...currentSupplier, notes: e.target.value })}
                  placeholder="Additional notes about this supplier"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to delete this supplier? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive"
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
