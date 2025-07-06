'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface EmailTagsProps {
  initialTags?: Tag[];
  messageId: string;
  onTagsChange?: (tags: Tag[]) => void;
  readOnly?: boolean;
}

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export default function EmailTags({ 
  initialTags = [], 
  messageId, 
  onTagsChange,
  readOnly = false 
}: EmailTagsProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name: newTagName.trim(),
      color: selectedColor,
    };
    
    const updatedTags = [...tags, newTag];
    setTags(updatedTags);
    setNewTagName('');
    setShowTagInput(false);
    
    // Save tags to the server
    try {
      await saveTagsToServer(messageId, updatedTags);
      onTagsChange?.(updatedTags);
    } catch (error) {
      console.error('Failed to save tags:', error);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    const updatedTags = tags.filter(tag => tag.id !== tagId);
    setTags(updatedTags);
    
    // Save tags to the server
    try {
      await saveTagsToServer(messageId, updatedTags);
      onTagsChange?.(updatedTags);
    } catch (error) {
      console.error('Failed to save tags:', error);
    }
  };

  const saveTagsToServer = async (messageId: string, tags: Tag[]) => {
    // This would be implemented to save tags to the server
    // For now, we'll just simulate a successful save
    return new Promise<void>(resolve => setTimeout(resolve, 100));
  };

  return (
    <div className="email-tags">
      <div className="flex flex-wrap gap-2 items-center">
        {tags.map(tag => (
          <div 
            key={tag.id}
            className="flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: tag.color }}
          >
            <span>{tag.name}</span>
            {!readOnly && (
              <button 
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        
        {!readOnly && !showTagInput && (
          <button 
            onClick={() => setShowTagInput(true)}
            className="flex items-center rounded-full px-2 py-1 text-xs border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            <Plus size={12} className="mr-1" />
            <span>Add Tag</span>
          </button>
        )}
      </div>
      
      {showTagInput && (
        <div className="mt-2 p-3 border rounded-md shadow-sm bg-white">
          <div className="mb-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name"
              className="w-full px-3 py-1 border rounded text-sm"
              autoFocus
            />
          </div>
          
          <div className="mb-3 flex flex-wrap gap-2">
            {DEFAULT_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full ${selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowTagInput(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTag}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!newTagName.trim()}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
