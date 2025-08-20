'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Folder, 
  FolderPlus, 
  Settings, 
  MoreHorizontal,
  Filter,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Copy,
  AlertCircle,
  Clock,
  Star,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmailFollowup } from '@/lib/email/follow-up-service';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface SmartFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  filter_rules: Record<string, any>;
  sort_order: string;
  auto_refresh: boolean;
  show_count: boolean;
  display_order: number;
  is_active: boolean;
  is_default: boolean;
  count?: number;
}

interface SmartFoldersProps {
  selectedFolderId?: string;
  onFolderSelect?: (folderId: string | null) => void;
  onFollowupsChange?: (followups: EmailFollowup[]) => void;
  className?: string;
}

const FOLDER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280'  // Gray
];

const FOLDER_ICONS = [
  { value: 'folder', label: 'Folder', icon: Folder },
  { value: 'clock', label: 'Clock', icon: Clock },
  { value: 'alert', label: 'Alert', icon: AlertCircle },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'calendar', label: 'Calendar', icon: Calendar },
  { value: 'check', label: 'Check', icon: CheckCircle }
];

export default function SmartFolders({
  selectedFolderId,
  onFolderSelect,
  onFollowupsChange,
  className
}: SmartFoldersProps) {
  const [folders, setFolders] = useState<SmartFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<SmartFolder | null>(null);

  // Create folder form state
  const [newFolder, setNewFolder] = useState({
    name: '',
    description: '',
    color: FOLDER_COLORS[0],
    icon: 'folder',
    filter_rules: {} as Record<string, any>,
    sort_order: 'due_date_asc',
    auto_refresh: true,
    show_count: true
  });

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/followups/smart-folders?include_count=true');
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders);
      }
    } catch (error) {
      console.error('Error loading smart folders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load smart folders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    try {
      const response = await fetch('/api/email/followups/smart-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFolder)
      });

      if (response.ok) {
        const data = await response.json();
        setFolders(prev => [...prev, { ...data.folder, count: 0 }]);
        setShowCreateDialog(false);
        resetNewFolder();
        
        toast({
          title: 'Success',
          description: 'Smart folder created successfully'
        });
      } else {
        throw new Error('Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create smart folder',
        variant: 'destructive'
      });
    }
  };

  const resetNewFolder = () => {
    setNewFolder({
      name: '',
      description: '',
      color: FOLDER_COLORS[0],
      icon: 'folder',
      filter_rules: {},
      sort_order: 'due_date_asc',
      auto_refresh: true,
      show_count: true
    });
  };

  const selectFolder = (folderId: string | null) => {
    if (onFolderSelect) {
      onFolderSelect(folderId);
    }
  };

  const toggleFolderVisibility = async (folderId: string, isActive: boolean) => {
    try {
      // This would be implemented with an update API endpoint
      setFolders(prev => prev.map(folder => 
        folder.id === folderId ? { ...folder, is_active: !isActive } : folder
      ));
      
      toast({
        title: 'Success',
        description: `Folder ${isActive ? 'hidden' : 'shown'}`
      });
    } catch (error) {
      console.error('Error toggling folder visibility:', error);
    }
  };

  const duplicateFolder = (folder: SmartFolder) => {
    setNewFolder({
      name: `${folder.name} (Copy)`,
      description: folder.description || '',
      color: folder.color,
      icon: folder.icon,
      filter_rules: { ...folder.filter_rules },
      sort_order: folder.sort_order,
      auto_refresh: folder.auto_refresh,
      show_count: folder.show_count
    });
    setShowCreateDialog(true);
  };

  const addFilterRule = (key: string, value: any) => {
    setNewFolder(prev => ({
      ...prev,
      filter_rules: {
        ...prev.filter_rules,
        [key]: value
      }
    }));
  };

  const removeFilterRule = (key: string) => {
    setNewFolder(prev => {
      const newRules = { ...prev.filter_rules };
      delete newRules[key];
      return {
        ...prev,
        filter_rules: newRules
      };
    });
  };

  const getIconComponent = (iconName: string) => {
    const iconData = FOLDER_ICONS.find(icon => icon.value === iconName);
    return iconData ? iconData.icon : Folder;
  };

  const renderFilterRules = (rules: Record<string, any>) => {
    if (Object.keys(rules).length === 0) {
      return <span className="text-gray-400 text-xs">No filters</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {Object.entries(rules).map(([key, value]) => (
          <Badge key={key} variant="outline" className="text-xs">
            {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Smart Folders</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetNewFolder}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Smart Folder</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newFolder.name}
                  onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Urgent Follow-ups"
                />
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input
                  value={newFolder.description}
                  onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this folder"
                />
              </div>

              {/* Appearance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {FOLDER_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewFolder(prev => ({ ...prev, color }))}
                        className={cn(
                          'w-6 h-6 rounded-full border-2',
                          newFolder.color === color ? 'border-gray-400' : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select
                    value={newFolder.icon}
                    onValueChange={(value) => setNewFolder(prev => ({ ...prev, icon: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FOLDER_ICONS.map(icon => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <icon.icon className="h-4 w-4" />
                            {icon.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Rules */}
              <div className="space-y-3">
                <Label>Filter Rules</Label>
                
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm">Status</Label>
                  <Select
                    value={newFolder.filter_rules.status ? newFolder.filter_rules.status.join(',') : ''}
                    onValueChange={(value) => {
                      if (value) {
                        addFilterRule('status', value.split(','));
                      } else {
                        removeFilterRule('status');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="due">Due</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="due,overdue">Due & Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Filter */}
                <div className="space-y-2">
                  <Label className="text-sm">Priority</Label>
                  <Select
                    value={newFolder.filter_rules.priority ? newFolder.filter_rules.priority.join(',') : ''}
                    onValueChange={(value) => {
                      if (value) {
                        addFilterRule('priority', value.split(','));
                      } else {
                        removeFilterRule('priority');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high,urgent">High & Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={newFolder.auto_refresh}
                    onChange={(e) => setNewFolder(prev => ({ ...prev, auto_refresh: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="autoRefresh" className="text-sm">Auto refresh</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showCount"
                    checked={newFolder.show_count}
                    onChange={(e) => setNewFolder(prev => ({ ...prev, show_count: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="showCount" className="text-sm">Show count</Label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={createFolder} disabled={!newFolder.name.trim()}>
                  Create Folder
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* All Emails Option */}
      <Card 
        className={cn(
          'cursor-pointer transition-colors hover:bg-gray-50',
          !selectedFolderId && 'ring-2 ring-blue-500 bg-blue-50'
        )}
        onClick={() => selectFolder(null)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Folder className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">All Follow-ups</h4>
              <p className="text-xs text-gray-500">View all follow-ups</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Folders */}
      <div className="space-y-2">
        <AnimatePresence>
          {folders
            .filter(folder => folder.is_active)
            .sort((a, b) => a.display_order - b.display_order)
            .map((folder) => {
              const IconComponent = getIconComponent(folder.icon);
              
              return (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card 
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-gray-50',
                      selectedFolderId === folder.id && 'ring-2 ring-blue-500 bg-blue-50'
                    )}
                    onClick={() => selectFolder(folder.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: folder.color + '20' }}
                        >
                          <IconComponent 
                            className="h-4 w-4" 
                            style={{ color: folder.color }}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{folder.name}</h4>
                            {folder.show_count && folder.count !== undefined && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: folder.color + '20',
                                  color: folder.color 
                                }}
                              >
                                {folder.count}
                              </Badge>
                            )}
                            {folder.is_default && (
                              <Badge variant="outline" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          
                          {folder.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {folder.description}
                            </p>
                          )}
                          
                          <div className="mt-1">
                            {renderFilterRules(folder.filter_rules)}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => duplicateFolder(folder)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingFolder(folder)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toggleFolderVisibility(folder.id, folder.is_active)}
                            >
                              {folder.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Show
                                </>
                              )}
                            </DropdownMenuItem>
                            {!folder.is_default && (
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {folders.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Folder className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 mb-3">No smart folders yet</p>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Your First Folder
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
