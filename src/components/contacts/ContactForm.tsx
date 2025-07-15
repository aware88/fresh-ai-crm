'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { Contact, ContactCreateInput, ContactUpdateInput } from '@/lib/contacts/types';
import { 
  ArisForm, 
  ArisFormGrid, 
  ArisInput, 
  ArisTextarea, 
  ArisSelect, 
  ArisSubmitButton 
} from '@/components/ui/aris-form';
import { SelectItem } from '@/components/ui/select';
import { User, Mail, Phone, Building, Briefcase, FileText, Brain } from 'lucide-react';

// Form schema
const contactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
  personalityType: z.string().optional(),
  personalityNotes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'lead', 'customer']),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  contact?: Contact;
  onSuccess?: () => void;
}

export default function ContactForm({ contact, onSuccess }: ContactFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!contact;

  // Initialize form with default values or existing contact data
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: contact?.firstName || '',
      lastName: contact?.lastName || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      company: contact?.company || '',
      position: contact?.position || '',
      notes: contact?.notes || '',
      personalityType: contact?.personalityType || '',
      personalityNotes: contact?.personalityNotes || '',
      status: contact?.status || 'active',
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        // Update existing contact
        const updateData: ContactUpdateInput = {
          id: contact.id,
          ...values,
        };
        
        const response = await fetch(`/api/contacts/${contact.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update contact');
        }
        
        toast({
          title: 'Success',
          description: 'Contact updated successfully',
        });
      } else {
        // Create new contact
        const createData: ContactCreateInput = values;
        
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create contact');
        }
        
        toast({
          title: 'Success',
          description: 'Contact created successfully',
        });
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/contacts');
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to save contact. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ArisForm
      title={isEditing ? 'Edit Contact' : 'Add New Contact'}
      description={isEditing ? 'Update contact information' : 'Add a new contact to your CRM'}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <ArisFormGrid columns={2}>
        <ArisInput
          label="First Name"
          placeholder="John"
          required
          icon={<User className="h-4 w-4" />}
          error={form.formState.errors.firstName?.message}
          {...form.register('firstName')}
        />
        
        <ArisInput
          label="Last Name"
          placeholder="Doe"
          required
          icon={<User className="h-4 w-4" />}
          error={form.formState.errors.lastName?.message}
          {...form.register('lastName')}
        />
        
        <ArisInput
          label="Email"
          type="email"
          placeholder="john.doe@example.com"
          required
          icon={<Mail className="h-4 w-4" />}
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />
        
        <ArisInput
          label="Phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          icon={<Phone className="h-4 w-4" />}
          error={form.formState.errors.phone?.message}
          {...form.register('phone')}
        />
        
        <ArisInput
          label="Company"
          placeholder="Acme Corp"
          icon={<Building className="h-4 w-4" />}
          error={form.formState.errors.company?.message}
          {...form.register('company')}
        />
        
        <ArisInput
          label="Position"
          placeholder="Software Engineer"
          icon={<Briefcase className="h-4 w-4" />}
          error={form.formState.errors.position?.message}
          {...form.register('position')}
        />
      </ArisFormGrid>
      
      <ArisFormGrid columns={2}>
        <ArisSelect
          label="Status"
          placeholder="Select status"
          required
          value={form.watch('status')}
          onValueChange={(value) => form.setValue('status', value as ContactFormValues['status'])}
          error={form.formState.errors.status?.message}
        >
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="lead">Lead</SelectItem>
          <SelectItem value="customer">Customer</SelectItem>
        </ArisSelect>
        
        <ArisInput
          label="Personality Type"
          placeholder="ENFP, Analytical, etc."
          icon={<Brain className="h-4 w-4" />}
          error={form.formState.errors.personalityType?.message}
          {...form.register('personalityType')}
        />
      </ArisFormGrid>
      
      <ArisFormGrid columns={1}>
        <ArisTextarea
          label="Notes"
          placeholder="General notes about this contact..."
          rows={3}
          maxLength={500}
          showCount
          error={form.formState.errors.notes?.message}
          {...form.register('notes')}
        />
        
        <ArisTextarea
          label="Personality Notes"
          placeholder="Notes about personality, communication style, preferences..."
          rows={3}
          maxLength={500}
          showCount
          error={form.formState.errors.personalityNotes?.message}
          {...form.register('personalityNotes')}
        />
      </ArisFormGrid>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => router.back()}
        >
          Cancel
        </button>
        
        <ArisSubmitButton
          loading={isSubmitting}
          loadingText={isEditing ? 'Updating...' : 'Creating...'}
        >
          {isEditing ? 'Update Contact' : 'Create Contact'}
        </ArisSubmitButton>
      </div>
    </ArisForm>
  );
}
