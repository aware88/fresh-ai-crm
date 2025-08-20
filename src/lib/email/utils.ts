export function generateEmailPreview(body: string, length: number = 100): string {
  if (!body) return '';
  
  // Remove HTML tags
  const textContent = body.replace(/<[^>]*>/g, ' ');
  
  // Remove CSS styles
  const noCssContent = textContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  
  // Remove Outlook VML behavior code and other strange characters
  const noVmlContent = noCssContent
    .replace(/v\\\:\*\s*\{behavior:url\(#default#VML\);\}/gi, '')
    .replace(/o\\\:\*\s*\{behavior:url\(#default#VML\);\}/gi, '')
    .replace(/v\:\*\s*\{behavior:url\(#default#VML\);\}/gi, '')
    .replace(/o\:\*\s*\{behavior:url\(#default#VML\);\}/gi, '')
    .replace(/w\\\:\*\s*\{behavior:[^}]*\}/gi, '')
    .replace(/w\:\*\s*\{behavior:[^}]*\}/gi, '')
    .replace(/\.shape\s*\{[^}]*\}/gi, '')
    .replace(/\{behavior:[^}]*\}/gi, '')
    .replace(/mso-[^:]*:[^;]*;/gi, '')
    .replace(/<!--\[if[^>]*>[\s\S]*?<!\[endif\]-->/gi, '');
  
  // Remove excessive whitespace and normalize
  const cleanedContent = noVmlContent.replace(/\s+/g, ' ').trim();
  
  if (cleanedContent.length <= length) {
    return cleanedContent;
  }
  
  return cleanedContent.substring(0, length).trim() + '...';
} 