import React, { useRef, useEffect, useState } from 'react';
import { parseEmailContent } from '@/lib/email/email-content-parser';

interface EmailRendererProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Professional Email Renderer with Iframe Sandboxing
 * 
 * Uses the same approach as Gmail, Proton Mail, and other professional email clients:
 * - Iframe sandboxing for complete CSS isolation
 * - DOMPurify-style HTML sanitization
 * - Content Security Policy for security
 * - Proper DOM isolation to prevent style conflicts
 */
export function EmailRenderer({ content, className = '', style = {} }: EmailRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
  const parsedContent = parseEmailContent(content);
    
    // Reset scroll position when content changes
    setIsLoaded(false);

    // Create the complete HTML document for the iframe
    const iframeContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: https: http:; font-src 'self' data:;">
  <style>
    /* Reset and base styles */
    * {
      box-sizing: border-box;
      max-width: 100%;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      font-family: 'Google Sans', Roboto, RobotoDraft, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #202124;
      background: transparent;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    body {
      padding: 0;
      margin: 0;
    }
    
    /* Gmail-like seamless email styling */
    img {
      max-width: 100% !important;
      height: auto !important;
      display: inline-block;
      border: none;
      margin: 0;
      padding: 0;
      vertical-align: middle;
    }
    
    table {
      width: 100% !important;
      max-width: 100% !important;
      border-collapse: collapse;
      margin: 0;
      padding: 0;
      font-family: inherit;
      border: none;
    }
    
    td, th {
      word-wrap: break-word;
      overflow-wrap: break-word;
      padding: 8px;
      border: none;
      vertical-align: top;
      background: transparent;
    }
    
    th {
      font-weight: 600;
      background: transparent;
    }
    
    p {
      margin: 0;
      padding: 0;
      line-height: 1.6;
      word-wrap: break-word;
      font-size: 14px;
      background: transparent;
    }
    
    div {
      margin: 0;
      padding: 0;
      word-wrap: break-word;
      font-size: 14px;
      background: transparent;
      border: none;
      box-shadow: none;
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin: 16px 0 8px 0;
      font-weight: 600;
      color: #202124;
      line-height: 1.3;
    }
    
    a {
      color: #1a73e8;
      text-decoration: none;
      word-break: break-all;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    ul, ol {
      margin: 8px 0;
      padding-left: 20px;
      line-height: 1.6;
    }
    
    li {
      margin: 4px 0;
      line-height: 1.5;
    }
    
    blockquote {
      border-left: 2px solid #dadce0;
      padding: 0 0 0 8px;
      margin: 0;
      background: transparent;
      color: #5f6368;
      font-style: italic;
    }
    
    code {
      background: transparent;
      padding: 0;
      border: none;
      font-family: monospace;
      font-size: 13px;
    }
    
    pre {
      background: transparent;
      padding: 0;
      border: none;
      overflow-x: auto;
      font-family: monospace;
      font-size: 13px;
      line-height: 1.4;
      margin: 0;
      white-space: pre-wrap;
    }
    
    /* Responsive design */
    @media only screen and (max-width: 600px) {
      body {
        padding: 12px;
        font-size: 13px;
      }
      
      table {
        font-size: 12px;
      }
      
      td, th {
        padding: 6px 8px;
        font-size: 12px;
      }
      
      img {
        margin: 6px 0;
      }
    }
  </style>
</head>
<body>
  ${parsedContent.displayContent}
</body>
</html>`;

    // Write content to iframe using srcdoc for better security
    iframe.srcdoc = iframeContent;
    
    // Handle iframe load event
    const handleLoad = () => {
      setIsLoaded(true);
      
      // Reset scroll position to top when new content loads
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.scrollTo(0, 0);
        }
      } catch (error) {
        // Silently handle cross-origin errors
      }
      
      // Auto-resize iframe to content height
      try {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDocument) {
          const resizeIframe = () => {
            const body = iframeDocument.body;
            const html = iframeDocument.documentElement;
            const height = Math.max(
              body?.scrollHeight || 0,
              body?.offsetHeight || 0,
              html?.clientHeight || 0,
              html?.scrollHeight || 0,
              html?.offsetHeight || 0
            );
            iframe.style.height = `${height}px`;
          };
          
          // Initial resize
          setTimeout(resizeIframe, 100);
          
          // Resize on window resize
          if (iframe.contentWindow) {
            iframe.contentWindow.addEventListener('resize', resizeIframe);
          }
          
          // Watch for content changes (images loading, etc.)
          const observer = new MutationObserver(resizeIframe);
          observer.observe(iframeDocument.body, {
            childList: true,
            subtree: true,
            attributes: true
          });
          
          // Cleanup observer when component unmounts
          return () => observer.disconnect();
        }
      } catch (error) {
        console.warn('Could not auto-resize email iframe:', error);
      }
    };

    iframe.addEventListener('load', handleLoad);
    
    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [content]);

  return (
    <div className={`email-renderer ${className}`} style={style}>
      <iframe
        ref={iframeRef}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      style={{
          width: '100%',
          minHeight: '200px',
          border: 'none',
          backgroundColor: 'transparent',
          display: isLoaded ? 'block' : 'none'
        }}
        title="Email content"
        loading="lazy"
      />
      {!isLoaded && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          color: '#5f6368',
          fontSize: '14px'
        }}>
          Loading email content...
        </div>
      )}
    </div>
  );
}

/**
 * EmailPreview - Generate a clean text preview for email lists
 */
export function EmailPreview({ content, maxLength = 150 }: { content: string; maxLength?: number }) {
  const parsedContent = parseEmailContent(content);
  const preview = parsedContent.text.substring(0, maxLength);
  return preview + (parsedContent.text.length > maxLength ? '...' : '');
}

/**
 * EmailSubject - Display email subject with proper truncation
 */
export function EmailSubject({ subject, className = '' }: { subject: string; className?: string }) {
  return (
    <div 
      className={`email-subject ${className}`}
      title={subject}
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
    >
      {subject || '(No subject)'}
    </div>
  );
}

export default EmailRenderer; 