export interface EmailContent {
  text: string;
  html: string;
  displayContent: string;
  isHtml: boolean;
}

/**
 * Parse and clean email content for safe display
 */
export function parseEmailContent(rawContent: string): EmailContent {
  if (!rawContent || rawContent.trim() === '') {
    return {
      text: '',
      html: '',
      displayContent: '<p class="text-gray-500 italic">This email has no content or the content could not be loaded.</p>',
      isHtml: true
    };
  }

  // Check if content looks like HTML
  const isHtml = /<[a-z][\s\S]*>/i.test(rawContent);
  
  if (isHtml) {
    // Clean HTML for safe display
    const cleanHtml = cleanHtmlContent(rawContent);
    const textContent = extractTextFromHtml(rawContent);
    
    return {
      text: textContent,
      html: cleanHtml,
      displayContent: cleanHtml,
      isHtml: true
    };
  } else {
    // Plain text content
    const formattedText = formatPlainText(rawContent);
    
    return {
      text: rawContent,
      html: formattedText,
      displayContent: formattedText,
      isHtml: false
    };
  }
}

/**
 * Clean HTML content by removing dangerous elements and styling appropriately
 */
function cleanHtmlContent(html: string): string {
  // Remove script tags, style blocks, and other dangerous elements
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
  
  // Clean up DOCTYPE and HTML structure tags if present
  cleaned = cleaned
    .replace(/<!DOCTYPE[^>]*>/i, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<body[^>]*>/gi, '<div class="email-body">')
    .replace(/<\/body>/gi, '</div>');
  
  // Preserve important formatting but ensure safety
  cleaned = cleaned
    .replace(/<table([^>]*)>/gi, '<table class="w-full border-collapse" $1>')
    .replace(/<td([^>]*)>/gi, '<td class="p-2 border-gray-200" $1>')
    .replace(/<th([^>]*)>/gi, '<th class="p-2 font-semibold bg-gray-100 border-gray-200" $1>')
    .replace(/<p([^>]*)>/gi, '<p class="mb-2" $1>')
    .replace(/<div([^>]*)>/gi, '<div class="mb-1" $1>');
  
  // Remove excessive whitespace and normalize
  cleaned = cleaned
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
}

/**
 * Extract plain text from HTML content
 */
function extractTextFromHtml(html: string): string {
  // Simple HTML to text conversion
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<\/h[1-6]>/gi, ' ')
    .replace(/<\/li>/gi, ' ')
    .replace(/<\/tr>/gi, ' ')
    .replace(/<\/td>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Format plain text content with basic HTML formatting
 */
function formatPlainText(text: string): string {
  return text
    .replace(/\n\n+/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br>')
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
    .replace(/^(.)/g, '<p class="mb-2">$1')
    .concat('</p>')
    .replace(/<p class="mb-2"><\/p>/g, '');
}

/**
 * Generate a preview/snippet of email content
 */
export function generateEmailPreview(content: EmailContent, maxLength: number = 150): string {
  const text = content.text || extractTextFromHtml(content.displayContent);
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + '...';
} 