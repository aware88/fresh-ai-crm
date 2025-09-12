'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Undo2,
  Redo2,
  Palette,
  Highlighter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  const [selectedFontFamily, setSelectedFontFamily] = useState('Arial');
  const [selectedFontSize, setSelectedFontSize] = useState('3');

  // Color palettes
  const textColors = [
    '#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff',
    '#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#00ccff', '#0066ff',
    '#9900ff', '#ff00ff', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3',
    '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc'
  ];

  const bgColors = [
    'transparent', '#ffffff', '#ffff00', '#00ff00', '#00ffff', '#0000ff',
    '#ff00ff', '#ff0000', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3'
  ];

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
      let expectedHtml = value;
      
      // If value looks like markdown (no HTML tags), convert it
      if (value && !value.includes('<') && !value.includes('>')) {
        expectedHtml = convertMarkdownToHtml(value);
      }
      
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
      let expectedHtml = value;
      
      // If value looks like markdown (no HTML tags), convert it
      if (value && !value.includes('<') && !value.includes('>')) {
        expectedHtml = convertMarkdownToHtml(value);
      }
      
      if (editorRef.current.innerHTML !== expectedHtml) {
        editorRef.current.innerHTML = expectedHtml;
        setHtmlContent(expectedHtml);
      }
    }
  }, [value]);

  const executeCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    
    // Focus editor first
    editorRef.current.focus();
    
    try {
      // Execute the command
      const success = document.execCommand(command, false, value);
      
      // If command failed, log it for debugging
      if (!success) {
        console.warn(`Command ${command} failed or not supported`);
      }
      
      // Force update content
      setTimeout(() => updateContent(), 10);
    } catch (error) {
      console.error(`Error executing command ${command}:`, error);
    }
  };

  const updateContent = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlContent(html);
      
      // For rich text mode, pass HTML directly
      // For plain text mode, convert to plain text
      if (isRichMode) {
        onChange(html);
      } else {
        const markdown = convertHtmlToMarkdown(html);
        onChange(markdown);
      }
    }
  };

  // Formatting functions
  const formatBold = () => executeCommand('bold');
  const formatItalic = () => executeCommand('italic');
  const formatUnderline = () => executeCommand('underline');
  
  const formatBulletList = () => {
    // Focus first to ensure proper selection
    editorRef.current?.focus();
    
    // Try multiple approaches for better browser compatibility
    try {
      executeCommand('insertUnorderedList');
    } catch (e) {
      console.warn('Standard bullet list failed, trying alternative');
      // Alternative approach
      const selection = window.getSelection();
      if (selection?.rangeCount) {
        executeCommand('formatBlock', 'div');
        executeCommand('insertHTML', '<ul><li></li></ul>');
      }
    }
  };
  
  const formatNumberedList = () => {
    // Focus first to ensure proper selection
    editorRef.current?.focus();
    
    try {
      executeCommand('insertOrderedList');
    } catch (e) {
      console.warn('Standard numbered list failed, trying alternative');
      // Alternative approach
      const selection = window.getSelection();
      if (selection?.rangeCount) {
        executeCommand('formatBlock', 'div');
        executeCommand('insertHTML', '<ol><li></li></ol>');
      }
    }
  };
  const formatLink = () => {
    const url = prompt('Enter URL:');
    if (url) executeCommand('createLink', url);
  };
  const formatQuote = () => executeCommand('formatBlock', 'blockquote');
  const formatCode = () => executeCommand('formatBlock', 'pre');
  const insertHR = () => executeCommand('insertHorizontalRule');
  const undo = () => executeCommand('undo');
  const redo = () => executeCommand('redo');

  // Font functions
  const changeFontFamily = (font: string) => {
    setSelectedFontFamily(font);
    executeCommand('fontName', font);
  };

  const changeFontSize = (size: string) => {
    setSelectedFontSize(size);
    executeCommand('fontSize', size);
  };

  // Alignment functions
  const alignLeft = () => executeCommand('justifyLeft');
  const alignCenter = () => executeCommand('justifyCenter');
  const alignRight = () => executeCommand('justifyRight');
  const alignJustify = () => executeCommand('justifyFull');

  // Color functions
  const changeTextColor = (color: string) => {
    executeCommand('foreColor', color);
  };

  const changeBackgroundColor = (color: string) => {
    // Try different commands for cross-browser compatibility
    const commands = ['hiliteColor', 'backColor', 'backgroundColor'];
    
    for (const cmd of commands) {
      try {
        if (document.queryCommandSupported(cmd)) {
          executeCommand(cmd, color);
          return;
        }
      } catch (e) {
        console.warn(`Command ${cmd} not supported`);
      }
    }
    
    // Fallback: manual styling
    const selection = window.getSelection();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.backgroundColor = color;
      
      try {
        range.surroundContents(span);
        updateContent();
      } catch (e) {
        console.warn('Manual background color failed:', e);
      }
    }
  };

  // Heading functions
  const formatHeading = (level: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    try {
      if (level === 'p') {
        // For paragraph/normal text, we need to handle it specially
        // because some browsers don't support formatBlock with 'p'
        const success = document.execCommand('formatBlock', false, 'p');
        if (!success) {
          // Fallback: try with 'div' and then clean up
          document.execCommand('formatBlock', false, 'div');
          // If that doesn't work, try removing formatting
          const selection = window.getSelection();
          if (selection?.rangeCount) {
            const range = selection.getRangeAt(0);
            const parentElement = range.commonAncestorContainer.parentElement;
            if (parentElement && /^H[1-6]$/.test(parentElement.tagName)) {
              // Manually unwrap heading
              const textContent = parentElement.textContent;
              const newP = document.createElement('p');
              newP.textContent = textContent || '';
              parentElement.parentNode?.replaceChild(newP, parentElement);
            }
          }
        }
      } else {
        // Regular heading formatting
        executeCommand('formatBlock', level);
      }
      
      setTimeout(() => updateContent(), 10);
    } catch (error) {
      console.error('Error formatting heading:', error);
    }
  };

  const toggleRichMode = () => {
    if (isRichMode) {
      // Switching to plain text - convert HTML to markdown
      const html = editorRef.current?.innerHTML || '';
      const markdown = convertHtmlToMarkdown(html);
      onChange(markdown);
    } else {
      // Switching to rich text - convert markdown to HTML if needed
      let htmlContent = value;
      if (value && !value.includes('<') && !value.includes('>')) {
        htmlContent = convertMarkdownToHtml(value);
      }
      setHtmlContent(htmlContent);
      onChange(htmlContent);
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
        .editor-content {
          font-family: ${selectedFontFamily}, sans-serif;
        }
        .editor-content ul {
          list-style-type: disc;
          list-style-position: inside;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .editor-content ol {
          list-style-type: decimal;
          list-style-position: inside;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .editor-content li {
          margin: 0.25em 0;
          line-height: 1.5;
        }
        .editor-content blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1em;
          margin-left: 0;
          color: #6b7280;
        }
        .editor-content pre {
          background-color: #f3f4f6;
          padding: 0.5em;
          border-radius: 4px;
          font-family: monospace;
        }
        .editor-content a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .editor-content p, .editor-content div {
          margin: 8px 0;
          word-break: break-word;
          overflow-wrap: anywhere;
          font-size: inherit;
          font-weight: normal;
          line-height: 1.6;
        }
        .editor-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
          color: #111827;
        }
        .editor-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
          color: #111827;
        }
        .editor-content h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.5em 0;
          color: #111827;
        }
        .editor-content h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 0.4em 0;
          color: #111827;
        }
        .editor-content h5 {
          font-size: 0.83em;
          font-weight: bold;
          margin: 0.4em 0;
          color: #111827;
        }
        .editor-content h6 {
          font-size: 0.67em;
          font-weight: bold;
          margin: 0.4em 0;
          color: #111827;
        }
      `}</style>
      
      {/* Toolbar */}
      <div className="p-2 border-b bg-gray-50 rounded-t-lg">
        {/* First row - Font and formatting */}
        <div className="flex items-center gap-1 mb-2">
          {/* Font Family */}
          <Select value={selectedFontFamily} onValueChange={changeFontFamily}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Times New Roman">Times</SelectItem>
              <SelectItem value="Courier New">Courier</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
              <SelectItem value="Tahoma">Tahoma</SelectItem>
              <SelectItem value="Comic Sans MS">Comic Sans</SelectItem>
            </SelectContent>
          </Select>

          {/* Font Size */}
          <Select value={selectedFontSize} onValueChange={changeFontSize}>
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">8pt</SelectItem>
              <SelectItem value="2">10pt</SelectItem>
              <SelectItem value="3">12pt</SelectItem>
              <SelectItem value="4">14pt</SelectItem>
              <SelectItem value="5">18pt</SelectItem>
              <SelectItem value="6">24pt</SelectItem>
              <SelectItem value="7">36pt</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text formatting */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatBold}
            className="h-8 w-8 p-0"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatItalic}
            className="h-8 w-8 p-0"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatUnderline}
            className="h-8 w-8 p-0"
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Text Color"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-6 gap-1">
                {textColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: color }}
                    onClick={() => changeTextColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Background Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Highlight Color"
              >
                <Highlighter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-6 gap-1">
                {bgColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}
                    onClick={() => changeBackgroundColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Undo/Redo */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={undo}
            className="h-8 w-8 p-0"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={redo}
            className="h-8 w-8 p-0"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Second row - Lists, alignment, etc */}
        <div className="flex items-center gap-1">
          {/* Block Format Selector */}
          <Select defaultValue="p" onValueChange={(value) => formatHeading(value)}>
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Normal</SelectItem>
              <SelectItem value="h1">H1</SelectItem>
              <SelectItem value="h2">H2</SelectItem>
              <SelectItem value="h3">H3</SelectItem>
              <SelectItem value="h4">H4</SelectItem>
              <SelectItem value="h5">H5</SelectItem>
              <SelectItem value="h6">H6</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Alignment */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={alignLeft}
            className="h-8 w-8 p-0"
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={alignCenter}
            className="h-8 w-8 p-0"
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={alignRight}
            className="h-8 w-8 p-0"
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={alignJustify}
            className="h-8 w-8 p-0"
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
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

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Quote, Code, Link */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatQuote}
            className="h-8 w-8 p-0"
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatCode}
            className="h-8 w-8 p-0"
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatLink}
            className="h-8 w-8 p-0"
            title="Insert Link"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertHR}
            className="h-8 w-8 p-0"
            title="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="flex-1" />

          {/* Toggle mode */}
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
      </div>

      {/* Editor Area */}
      <div className="relative">
        {isRichMode ? (
          <div
            ref={editorRef}
            contentEditable
            onInput={updateContent}
            onPaste={(e) => {
              // Handle paste events to maintain formatting
              e.preventDefault();
              const paste = (e.clipboardData || window.clipboardData).getData('text/html') || 
                           (e.clipboardData || window.clipboardData).getData('text');
              if (paste) {
                document.execCommand('insertHTML', false, paste);
              }
            }}
            onKeyDown={(e) => {
              // Handle keyboard shortcuts
              if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                  case 'b':
                    e.preventDefault();
                    formatBold();
                    break;
                  case 'i':
                    e.preventDefault();
                    formatItalic();
                    break;
                  case 'u':
                    e.preventDefault();
                    formatUnderline();
                    break;
                }
              }
            }}
            className="editor-content border-0 rounded-none rounded-b-lg p-3 focus:outline-none focus:ring-0 min-h-[300px] max-w-none"
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
      </div>
    </div>
  );
}