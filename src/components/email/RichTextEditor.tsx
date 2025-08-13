'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded border" />
});

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
  
  // Gmail-like toolbar configuration
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean'],
      ['blockquote', 'code-block']
    ],
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'font', 'size', 'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align',
    'link', 'image',
    'blockquote', 'code-block'
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <style jsx global>{`
        .ql-editor {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #202124;
          min-height: ${height};
          padding: 12px 16px;
        }
        
        .ql-editor.ql-blank::before {
          color: #5f6368;
          font-style: normal;
          opacity: 0.6;
        }
        
        .ql-toolbar {
          border-top: 1px solid #dadce0;
          border-left: 1px solid #dadce0;
          border-right: 1px solid #dadce0;
          border-bottom: none;
          background-color: #f8f9fa;
          border-radius: 8px 8px 0 0;
          padding: 8px;
        }
        
        .ql-container {
          border-bottom: 1px solid #dadce0;
          border-left: 1px solid #dadce0;
          border-right: 1px solid #dadce0;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        
        .ql-toolbar .ql-formats {
          margin-right: 12px;
        }
        
        .ql-toolbar button {
          border-radius: 4px;
          margin: 1px;
        }
        
        .ql-toolbar button:hover {
          background-color: #e8f0fe;
          color: #1a73e8;
        }
        
        .ql-toolbar button.ql-active {
          background-color: #e8f0fe;
          color: #1a73e8;
          border-color: #1a73e8;
        }
        
        .ql-picker-label {
          border-radius: 4px;
        }
        
        .ql-picker-label:hover {
          background-color: #e8f0fe;
          color: #1a73e8;
        }
        
        .ql-editor h1 {
          font-size: 2em;
          font-weight: 600;
          margin: 16px 0 12px 0;
          color: #202124;
        }
        
        .ql-editor h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 14px 0 10px 0;
          color: #202124;
        }
        
        .ql-editor h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 12px 0 8px 0;
          color: #202124;
        }
        
        .ql-editor blockquote {
          border-left: 4px solid #4285f4;
          padding-left: 16px;
          margin: 16px 0;
          color: #5f6368;
          background-color: #f8f9fa;
          padding: 12px 16px;
          border-radius: 4px;
        }
        
        .ql-editor a {
          color: #1a73e8;
          text-decoration: underline;
        }
        
        .ql-editor a:hover {
          text-decoration: none;
        }
        
        .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 8px 0;
        }
        
        .rich-text-editor {
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
      
      <ReactQuill 
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
} 