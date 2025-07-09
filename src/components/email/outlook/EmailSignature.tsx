'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui';

interface EmailSignatureProps {
  onSelect: (signatureHtml: string) => void;
  compact?: boolean;
}

interface Signature {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export default function EmailSignature({ onSelect, compact = false }: EmailSignatureProps) {
  const { data: session } = useSession();
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editName, setEditName] = useState('');

  // Fetch user signatures
  useEffect(() => {
    async function fetchSignatures() {
      try {
        setLoading(true);
        // This would be a real API call in production
        // For now, we'll simulate loading signatures
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Mock data
        const mockSignatures: Signature[] = [
          {
            id: '1',
            name: 'Professional',
            content: `<div style="font-family: Arial, sans-serif; color: #333;">
              <p>Best regards,</p>
              <p><strong>${session?.user?.name || 'Your Name'}</strong></p>
              <p>CRM Mind</p>
              <p>Email: ${session?.user?.email || 'your.email@example.com'}</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>`,
            isDefault: true,
          },
          {
            id: '2',
            name: 'Casual',
            content: `<div style="font-family: Arial, sans-serif; color: #333;">
              <p>Thanks,</p>
              <p>${session?.user?.name?.split(' ')[0] || 'Your Name'}</p>
            </div>`,
            isDefault: false,
          },
        ];
        
        setSignatures(mockSignatures);
        
        // Set default signature
        const defaultSig = mockSignatures.find(sig => sig.isDefault) || mockSignatures[0];
        setSelectedSignature(defaultSig);
        
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch signatures:', err);
        setError('Failed to load signatures');
      } finally {
        setLoading(false);
      }
    }

    fetchSignatures();
  }, [session]);

  const handleSelectSignature = (signature: Signature) => {
    setSelectedSignature(signature);
    onSelect(signature.content);
  };

  const handleCreateSignature = () => {
    setIsEditing(true);
    setEditName('New Signature');
    setEditContent(`<div style="font-family: Arial, sans-serif; color: #333;">
      <p>Best regards,</p>
      <p><strong>${session?.user?.name || 'Your Name'}</strong></p>
    </div>`);
  };

  const handleEditSignature = (signature: Signature) => {
    setIsEditing(true);
    setEditName(signature.name);
    setEditContent(signature.content);
  };

  const handleSaveSignature = async () => {
    try {
      // This would be a real API call in production
      // For now, we'll simulate saving a signature
      const newSignature: Signature = {
        id: `sig-${Date.now()}`,
        name: editName,
        content: editContent,
        isDefault: signatures.length === 0, // Make default if it's the first one
      };
      
      setSignatures([...signatures, newSignature]);
      setSelectedSignature(newSignature);
      onSelect(newSignature.content);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to save signature:', err);
      setError('Failed to save signature');
    }
  };

  const handleSetDefault = async (signature: Signature) => {
    try {
      // This would be a real API call in production
      // For now, we'll simulate setting a default signature
      const updatedSignatures = signatures.map(sig => ({
        ...sig,
        isDefault: sig.id === signature.id,
      }));
      
      setSignatures(updatedSignatures);
      setSelectedSignature(signature);
      onSelect(signature.content);
    } catch (err: any) {
      console.error('Failed to set default signature:', err);
      setError('Failed to set default signature');
    }
  };

  if (compact) {
    return (
      <div className="email-signature-compact">
        <select
          className="w-full px-3 py-2 border rounded text-sm"
          value={selectedSignature?.id || ''}
          onChange={(e) => {
            const sig = signatures.find(s => s.id === e.target.value);
            if (sig) handleSelectSignature(sig);
          }}
          disabled={loading}
        >
          <option value="">No signature</option>
          {signatures.map(sig => (
            <option key={sig.id} value={sig.id}>
              {sig.name} {sig.isDefault ? '(Default)' : ''}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="email-signature">
      <h3 className="text-lg font-medium mb-4">Email Signatures</h3>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading signatures...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">{error}</div>
      ) : isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signature Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signature Content</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm font-mono"
              rows={8}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              onClick={() => setIsEditing(false)} 
              variant="outline"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSignature}
              disabled={!editName.trim() || !editContent.trim()}
            >
              Save Signature
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Signature</label>
              <select
                className="px-3 py-2 border rounded text-sm"
                value={selectedSignature?.id || ''}
                onChange={(e) => {
                  const sig = signatures.find(s => s.id === e.target.value);
                  if (sig) handleSelectSignature(sig);
                }}
              >
                <option value="">No signature</option>
                {signatures.map(sig => (
                  <option key={sig.id} value={sig.id}>
                    {sig.name} {sig.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <Button onClick={handleCreateSignature} variant="outline" size="sm">
              Create New
            </Button>
          </div>
          
          {selectedSignature && (
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">{selectedSignature.name}</h4>
                <div className="space-x-2">
                  {!selectedSignature.isDefault && (
                    <Button 
                      onClick={() => handleSetDefault(selectedSignature)} 
                      variant="outline" 
                      size="sm"
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleEditSignature(selectedSignature)} 
                    variant="outline" 
                    size="sm"
                  >
                    Edit
                  </Button>
                </div>
              </div>
              
              <div 
                className="signature-preview border p-3 rounded bg-gray-50"
                dangerouslySetInnerHTML={{ __html: selectedSignature.content }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
