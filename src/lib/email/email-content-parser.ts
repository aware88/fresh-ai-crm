import DOMPurify from 'dompurify';

export interface ParsedEmailContent {
  displayContent: string;
  text: string;
  hasImages: boolean;
  hasLinks: boolean;
}

/**
 * Professional Email Content Parser
 * 
 * Uses DOMPurify for HTML sanitization like Gmail, Proton Mail, and other professional email clients.
 * Implements security best practices to prevent XSS, DOM clobbering, and other email-based attacks.
 */

// DOMPurify configuration for email content
const DOMPURIFY_CONFIG = {
  // Allow only safe HTML elements
  ALLOWED_TAGS: [
    'div', 'p', 'span', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'hr'
  ],
  
  // Allow only safe attributes
  ALLOWED_ATTR: [
    'href', 'title', 'alt', 'src', 'width', 'height',
    'style', 'class', 'id',
    'colspan', 'rowspan',
    'start', 'type'
  ],
  
  // Security settings
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SANITIZE_DOM: true,
  SANITIZE_NAMED_PROPS: true,
  KEEP_CONTENT: true,
  
  // URL schemes to allow
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  
  // Hook to add additional security measures
  FORBID_TAGS: ['svg', 'math', 'style', 'script', 'object', 'embed', 'iframe', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur']
};

/**
 * Enhanced HTML sanitization with security hardening
 */
function sanitizeHTML(html: string): string {
  try {
    // First pass: Basic DOMPurify sanitization
    let sanitized = DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
    
    // Second pass: Additional security measures
    sanitized = sanitized
      // Remove any remaining script tags or javascript: URLs
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:text\/html/gi, 'data:text/plain')
      // Remove any DOM clobbering attempts
      .replace(/\s(name|id)=["']?(body|document|window|location|history)["']?/gi, '')
      // Remove VML behavior code that shows up in some Outlook-generated emails
      .replace(/v\\\:\*\s*\{behavior:url\(#default#VML\);\}/gi, '')
      .replace(/o\\\:\*\s*\{behavior:url\(#default#VML\);\}/gi, '')
      .replace(/v\:\*\s*\{behavior:url\(#default#VML\);\}/gi, '')
      .replace(/o\:\*\s*\{behavior:url\(#default#VML\);\}/gi, '')
      // Remove additional VML and Outlook-specific patterns
      .replace(/w\\\:\*\s*\{behavior:[^}]*\}/gi, '')
      .replace(/w\:\*\s*\{behavior:[^}]*\}/gi, '')
      .replace(/\.shape\s*\{[^}]*\}/gi, '')
      .replace(/\{behavior:[^}]*\}/gi, '')
      .replace(/mso-[^:]*:[^;]*;/gi, '')
      .replace(/<!--\[if[^>]*>[\s\S]*?<!\[endif\]-->/gi, '')
      // Ensure safe link handling
      .replace(/<a([^>]*href=["'][^"']*["'][^>]*)>/gi, '<a$1 target="_blank" rel="noopener noreferrer">');
    
    return sanitized;
  } catch (error) {
    console.warn('HTML sanitization failed:', error);
    // Fallback to plain text if sanitization fails
    return html.replace(/<[^>]*>/g, '');
  }
}

/**
 * Apply Gmail-like styling to email content
 */
function enhanceEmailStyles(html: string): string {
  // Create a temporary DOM to process the content
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Enhance images
  const images = doc.querySelectorAll('img');
  images.forEach(img => {
    const imgElement = img as HTMLImageElement;
    // Seamless Gmail-like image styling
    imgElement.style.maxWidth = '100%';
    imgElement.style.height = 'auto';
    imgElement.style.display = 'inline-block';
    imgElement.style.border = 'none';
    imgElement.style.margin = '0';
    imgElement.style.padding = '0';
    imgElement.style.background = 'transparent';
    imgElement.style.verticalAlign = 'middle';
    
    // Add loading attribute for performance
    imgElement.setAttribute('loading', 'lazy');
    
    // Ensure alt text exists
    if (!imgElement.getAttribute('alt')) {
      imgElement.setAttribute('alt', 'Image');
    }
  });
  
  // Enhance links
  const links = doc.querySelectorAll('a');
  links.forEach(link => {
    const linkElement = link as HTMLAnchorElement;
    linkElement.style.color = '#1a73e8';
    linkElement.style.textDecoration = 'none';
    linkElement.style.wordBreak = 'break-all';
    
    // Ensure safe link handling
    linkElement.setAttribute('target', '_blank');
    linkElement.setAttribute('rel', 'noopener noreferrer');
  });
  
  // Enhance tables
  const tables = doc.querySelectorAll('table');
  tables.forEach(table => {
    const tableElement = table as HTMLTableElement;
    tableElement.style.width = '100%';
    tableElement.style.maxWidth = '100%';
    tableElement.style.borderCollapse = 'collapse';
    tableElement.style.margin = '0';
    tableElement.style.padding = '0';
    tableElement.style.fontFamily = 'inherit';
    tableElement.style.border = 'none';
    tableElement.style.background = 'transparent';
    
    // Style table cells - seamless
    const cells = table.querySelectorAll('td, th');
    cells.forEach(cell => {
      const cellElement = cell as HTMLTableCellElement;
      cellElement.style.wordWrap = 'break-word';
      cellElement.style.overflowWrap = 'break-word';
      cellElement.style.padding = '8px';
      cellElement.style.border = 'none';
      cellElement.style.verticalAlign = 'top';
      cellElement.style.background = 'transparent';
    });
    
    // Style table headers - minimal
    const headers = table.querySelectorAll('th');
    headers.forEach(header => {
      const headerElement = header as HTMLTableCellElement;
      headerElement.style.background = 'transparent';
      headerElement.style.fontWeight = '600';
    });
  });
  
  // Enhance blockquotes - seamless
  const blockquotes = doc.querySelectorAll('blockquote');
  blockquotes.forEach(blockquote => {
    const blockquoteElement = blockquote as HTMLQuoteElement;
    blockquoteElement.style.borderLeft = '2px solid #dadce0';
    blockquoteElement.style.padding = '0 0 0 8px';
    blockquoteElement.style.margin = '0';
    blockquoteElement.style.background = 'transparent';
    blockquoteElement.style.color = '#5f6368';
    blockquoteElement.style.fontStyle = 'italic';
  });
  
  // Enhance code elements - seamless
  const codeElements = doc.querySelectorAll('code');
  codeElements.forEach(code => {
    const codeElement = code as HTMLElement;
    codeElement.style.background = 'transparent';
    codeElement.style.padding = '0';
    codeElement.style.border = 'none';
    codeElement.style.fontFamily = 'monospace';
    codeElement.style.fontSize = '13px';
  });
  
  const preElements = doc.querySelectorAll('pre');
  preElements.forEach(pre => {
    const preElement = pre as HTMLPreElement;
    preElement.style.background = 'transparent';
    preElement.style.padding = '0';
    preElement.style.border = 'none';
    preElement.style.overflowX = 'auto';
    preElement.style.fontFamily = 'monospace';
    preElement.style.fontSize = '13px';
    preElement.style.lineHeight = '1.4';
    preElement.style.margin = '0';
    preElement.style.whiteSpace = 'pre-wrap';
  });
  
  return doc.body.innerHTML;
}

/**
 * Extract plain text from HTML content
 */
function extractPlainText(html: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove script and style elements completely
    const scriptsAndStyles = doc.querySelectorAll('script, style');
    scriptsAndStyles.forEach(el => el.remove());
    
    // Get text content and clean it up
    let text = doc.body?.textContent || doc.textContent || '';
    
    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    return text;
  } catch (error) {
    console.warn('Plain text extraction failed:', error);
    // Fallback: strip HTML tags
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

/**
 * Check if content contains images
 */
function hasImages(html: string): boolean {
  return /<img[^>]+src=/i.test(html);
}

/**
 * Check if content contains links
 */
function hasLinks(html: string): boolean {
  return /<a[^>]+href=/i.test(html);
}

/**
 * Main email content parsing function
 */
export function parseEmailContent(content: string): ParsedEmailContent {
  if (!content || typeof content !== 'string') {
    return {
      displayContent: '',
      text: '',
      hasImages: false,
      hasLinks: false
    };
  }
  
  try {
    // Step 1: Sanitize the HTML content
    const sanitizedHTML = sanitizeHTML(content);
    
    // Step 2: Enhance with Gmail-like styling
    const styledHTML = enhanceEmailStyles(sanitizedHTML);
    
    // Step 3: Extract plain text
    const plainText = extractPlainText(sanitizedHTML);
    
    // Step 4: Analyze content features
    const contentHasImages = hasImages(sanitizedHTML);
    const contentHasLinks = hasLinks(sanitizedHTML);
    
    return {
      displayContent: styledHTML,
      text: plainText,
      hasImages: contentHasImages,
      hasLinks: contentHasLinks
    };
  } catch (error) {
    console.error('Email content parsing failed:', error);
    
    // Fallback: return safe plain text version
    const fallbackText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    return {
      displayContent: `<p>${fallbackText}</p>`,
      text: fallbackText,
      hasImages: false,
      hasLinks: false
    };
  }
}

/**
 * Generate a clean preview text for email lists
 */
export function generateEmailPreview(content: string, maxLength: number = 150): string {
  const parsed = parseEmailContent(content);
  const preview = parsed.text.substring(0, maxLength);
  return preview + (parsed.text.length > maxLength ? '...' : '');
}

/**
 * Security utilities for email content
 */
export const EmailSecurity = {
  /**
   * Check if content might contain malicious elements
   */
  isSuspicious(content: string): boolean {
    const suspiciousPatterns = [
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i,
      /<script/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /on\w+\s*=/i, // Event handlers
      /expression\s*\(/i, // CSS expressions
      /import\s+/i // CSS imports
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(content));
  },
  
  /**
   * Get security score for email content (0-100, higher is safer)
   */
  getSecurityScore(content: string): number {
    let score = 100;
    
    if (this.isSuspicious(content)) score -= 30;
    if (/<style/i.test(content)) score -= 10;
    if (/<svg/i.test(content)) score -= 15;
    if (/data:/i.test(content)) score -= 10;
    if (content.length > 50000) score -= 5; // Very large content
    
    return Math.max(0, score);
  }
}; 