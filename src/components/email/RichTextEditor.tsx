'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const editorRef = useRef<HTMLDivElement>(null);
  const [isRichMode, setIsRichMode] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');

  // Convert HTML to plain text and vice versa
  const convertMarkdownToHtml = (markdown: string) => {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/\n/g, '<br>');
  };

  const convertHtmlToMarkdown = (html: string) => {
    return html
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, ''); // Remove any other HTML tags
  };

  // Initialize and update HTML content
  useEffect(() => {
    if (isRichMode && editorRef.current) {
      const expectedHtml = convertMarkdownToHtml(value);
      
      // Initialize content if empty or different
      if (editorRef.current.innerHTML !== expectedHtml) {
        editorRef.current.innerHTML = expectedHtml;
        setHtmlContent(expectedHtml);
      }
    }
  }, [isRichMode]);

  // Update content when value changes from parent (but not during user input)
  useEffect(() => {
    if (isRichMode && editorRef.current && !editorRef.current.contains(document.activeElement)) {
      const expectedHtml = convertMarkdownToHtml(value);
      if (editorRef.current.innerHTML !== expectedHtml) {
        editorRef.current.innerHTML = expectedHtml;
        setHtmlContent(expectedHtml);
      }
    }
  }, [value]);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const markdown = convertHtmlToMarkdown(html);
      setHtmlContent(html);
      onChange(markdown);
    }
  };

  const formatBold = () => executeCommand('bold');
  const formatItalic = () => executeCommand('italic');
  const formatUnderline = () => executeCommand('underline');
  const formatBulletList = () => executeCommand('insertUnorderedList');
  const formatNumberedList = () => executeCommand('insertOrderedList');
  const formatLink = () => {
    const url = prompt('Enter URL:');
    if (url) executeCommand('createLink', url);
  };

  const toggleRichMode = () => {
    if (isRichMode) {
      // Switching to plain text
      const markdown = convertHtmlToMarkdown(editorRef.current?.innerHTML || '');
      onChange(markdown);
    } else {
      // Switching to rich text
      setHtmlContent(convertMarkdownToHtml(value));
    }
    setIsRichMode(!isRichMode);
  };

  return (
    <div className={`rich-text-editor border rounded-lg ${className}`}>
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable]:focus:before {
          content: '';
        }
      `}</style>
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

      {/* Editor Area */}
      <div className="relative">
        {isRichMode ? (
          <div
            ref={editorRef}
            contentEditable
            onInput={updateContent}
            className="border-0 rounded-none rounded-b-lg p-3 focus:outline-none focus:ring-0 min-h-[300px] prose prose-sm max-w-none"
            style={{ minHeight: height }}
            suppressContentEditableWarning={true}
            data-placeholder={placeholder}
          />
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="border-0 rounded-none rounded-b-lg resize-none focus:ring-0 focus:border-0 p-3 w-full font-mono text-sm"
            style={{ minHeight: height }}
            rows={parseInt(height.replace('px', '')) / 20 || 15}
          />
        )}
        
        {/* Helper text */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded shadow-sm">
          {isRichMode ? 'Rich text mode' : 'Plain text mode'}
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