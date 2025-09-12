'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { fetchSupplierById, createSupplierEmail } from '@/lib/suppliers/api';
import { Supplier } from '@/types/supplier';
import { Loader2, FileText, Mail, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SupplierAIChat from '@/components/suppliers/SupplierAIChat';
import EmailComposer from '@/components/suppliers/EmailComposer';

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params?.id as string;
  
  // All hooks must be called before any conditional returns
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const loadSupplier = async () => {
      try {
        setLoading(true);
        const data = await fetchSupplierById(supplierId);
        setSupplier(data);
        setError(null);
      } catch (err) {
        console.error('Error loading supplier:', err);
        setError('Failed to load supplier details');
      } finally {
        setLoading(false);
      }
    };

    if (supplierId) {
      loadSupplier();
    }
  }, [supplierId]);
  
  if (!supplierId) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">
          Supplier ID not found
        </p>
        <Button asChild>
          <Link href="/suppliers">Back to Suppliers</Link>
        </Button>
      </div>
    );
  }

  const handleSendEmail = async (emailData: { to: string; subject: string; body: string }) => {
    if (!supplier) return;
    
    await createSupplierEmail(
      supplier.id,
      emailData.to,
      emailData.subject,
      emailData.body,
      supplier.contact_name || undefined
    );
    
    // Switch to the details tab after sending
    setActiveTab('details');
    
    // Refresh supplier data to show the new email
    const updatedSupplier = await fetchSupplierById(supplierId);
    setSupplier(updatedSupplier);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">
          {error || 'Supplier not found'}
        </p>
        <Button asChild>
          <Link href="/suppliers">Back to Suppliers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{supplier.name}</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/suppliers/${supplierId}/documents`}>
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="mr-2 h-4 w-4" />
            AI Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
              <CardDescription>Details about {supplier.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Contact</h3>
                  <p>{supplier.contact_name || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
                  <p>{supplier.email || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Phone</h3>
                  <p>{supplier.phone || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Address</h3>
                  <p>{supplier.address || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Website</h3>
                  <p>{supplier.website || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Product Categories</h3>
                  <p>{supplier.product_categories?.join(', ') || 'None specified'}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Notes</h3>
                <p className="whitespace-pre-wrap">{supplier.notes || 'No notes'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <EmailComposer supplier={supplier} onSendEmail={handleSendEmail} />
        </TabsContent>

        <TabsContent value="chat">
          <SupplierAIChat supplierId={supplier.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
