'use client';

import React, { useState, useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Compose your email...",
  className = "",
  height = "300px"
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isRichMode, setIsRichMode] = useState(false);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const formatBold = () => insertText('**', '**');
  const formatItalic = () => insertText('*', '*');
  const formatUnderline = () => insertText('<u>', '</u>');
  const formatBulletList = () => {
    const lines = value.split('\n');
    const start = textareaRef.current?.selectionStart || 0;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    insertText('\n• ', '');
  };
  const formatNumberedList = () => {
    insertText('\n1. ', '');
  };
  const formatLink = () => insertText('[', '](url)');

  const toggleRichMode = () => {
    setIsRichMode(!isRichMode);
  };

  return (
    <div className={`rich-text-editor border rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 rounded-t-lg">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatBold}
          className="h-8 w-8 p-0"
          title="Bold (**text**)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatItalic}
          className="h-8 w-8 p-0"
          title="Italic (*text*)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatUnderline}
          className="h-8 w-8 p-0"
          title="Underline (<u>text</u>)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatBulletList}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatNumberedList}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatLink}
          className="h-8 w-8 p-0"
          title="Link ([text](url))"
        >
          <Link className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleRichMode}
          className="h-8 px-2 text-xs"
          title={isRichMode ? "Switch to Plain Text" : "Switch to Rich Text"}
        >
          <Type className="h-4 w-4 mr-1" />
          {isRichMode ? 'Plain' : 'Rich'}
        </Button>
      </div>

      {/* Text Area */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-0 rounded-none rounded-b-lg resize-none focus:ring-0 focus:border-0"
          style={{ minHeight: height }}
          rows={parseInt(height.replace('px', '')) / 20 || 15}
        />
        
        {/* Helper text */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded">
          {isRichMode ? 'Markdown supported' : 'Plain text mode'}
        </div>
      </div>

      {/* Format Helper */}
      {isRichMode && (
        <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-600 rounded-b-lg">
          <div className="flex flex-wrap gap-4">
            <span><strong>**bold**</strong></span>
            <span><em>*italic*</em></span>
            <span><u>&lt;u&gt;underline&lt;/u&gt;</u></span>
            <span>• bullet list</span>
            <span>1. numbered list</span>
            <span>[link](url)</span>
          </div>
        </div>
      )}
    </div>
  );
}