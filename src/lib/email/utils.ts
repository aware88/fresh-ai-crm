export function generateEmailPreview(body: string, length: number = 100): string {
  // Remove HTML tags
  const textContent = body.replace(/<[^>]*>/g, ' ');
  
  // Remove CSS styles
  const noCssContent = textContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  
  // Remove excessive whitespace and normalize
  const cleanedContent = noCssContent.replace(/\s+/g, ' ').trim();
  
  if (cleanedContent.length <= length) {
    return cleanedContent;
  }
  
  return cleanedContent.substring(0, length).trim() + '...';
} 