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
  
  // Handle messages from the iframe for CID image replacement
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'EMAIL_CID_IMAGES' && event.data?.cids?.length > 0) {
        // Find parent component with attachments
        const emailDetailElement = document.querySelector('.email-detail-with-attachments');
        if (emailDetailElement) {
          // Trigger custom event to notify parent component
          const customEvent = new CustomEvent('email-cid-images', {
            detail: { cids: event.data.cids },
            bubbles: true
          });
          emailDetailElement.dispatchEvent(customEvent);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    
    console.log('📧 EmailRenderer received content:', content?.substring(0, 200));
    const parsedContent = parseEmailContent(content);
    console.log('📧 Parsed content:', parsedContent.displayContent?.substring(0, 200));
    
    // Reset scroll position when content changes
    setIsLoaded(false);

    // Create the complete HTML document for the iframe
    const iframeContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: https: http:; font-src 'self' data:; script-src 'unsafe-inline';">
  <style>
    /* Reset and base styles */
    * {
      box-sizing: border-box;
      max-width: 100% !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }
    
    /* Prevent any element from breaking layout */
    #email-content-container * {
      max-width: 100% !important;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
      word-wrap: break-word;
      overflow-wrap: break-word;
      overflow-x: hidden !important;
      max-width: 100% !important;
      width: 100% !important;
    }
    
    body {
      padding: 16px;
      margin: 0;
      border-radius: 8px;
      overflow-x: auto;
      max-width: 100vw;
    }
    
    /* Gmail-like seamless email styling */
    img {
      max-width: 100% !important;
      width: auto !important;
      height: auto !important;
      display: block !important;
      border: none;
      margin: 0 auto;
      padding: 0;
      vertical-align: middle;
    }
    
    table {
      max-width: 100% !important;
      width: auto !important;
      border-collapse: collapse;
      margin: 0;
      padding: 0;
      font-family: inherit;
      border: none;
      display: block;
      overflow-x: auto;
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
      margin: 0 0 12px 0;
      padding: 0;
      line-height: 1.6;
      word-wrap: break-word;
      font-size: 14px;
      color: #374151;
    }
    
    div {
      word-wrap: break-word;
      font-size: 14px;
      line-height: 1.6;
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin: 16px 0 8px 0;
      font-weight: 600;
      color: #202124;
      line-height: 1.3;
    }
    
    a {
      color: #2563eb;
      text-decoration: underline;
      word-break: break-word;
      transition: color 0.2s ease;
    }
    
    a:hover {
      color: #1d4ed8;
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
      word-break: break-all;
      max-width: 100%;
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
  <div id="email-content-container" style="width: 100%; overflow: hidden; word-break: break-word; overflow-wrap: break-word; box-sizing: border-box;">
    <div style="width: 100%; overflow-x: auto; overflow-y: visible; padding: 0;">
      ${parsedContent.displayContent}
    </div>
  </div>
  
  <script>
    // Find and process any inline attachments with CID references
    document.addEventListener('DOMContentLoaded', function() {
      // This script helps display inline attachments properly
      const images = document.querySelectorAll('img[data-attachment-cid]');
      if (images.length > 0) {
        // Signal to parent that we have CID images that need replacement
        window.parent.postMessage({
          type: 'EMAIL_CID_IMAGES',
          cids: Array.from(images).map(img => img.getAttribute('data-attachment-cid'))
        }, '*');
      }
    });
  </script>
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
    <div className={`email-renderer ${className}`} style={{ maxWidth: '100%', overflow: 'hidden', ...style }}>
      <iframe
        ref={iframeRef}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        style={{
          width: '100%',
          maxWidth: '100%',
          minHeight: '200px',
          border: 'none',
          backgroundColor: 'transparent',
          display: isLoaded ? 'block' : 'none',
          overflow: 'hidden',
          boxSizing: 'border-box'
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